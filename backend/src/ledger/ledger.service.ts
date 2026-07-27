import { cantonClient } from "./canton.client";
import { resolvePackageId } from "./packageId";
import { toDamlDecimal, fromDamlDecimal } from "./contract.mapper";
import { DamlCashHoldingPayload, DamlEscrowPayload } from "./contract.types";
import { LedgerError } from "../exceptions/LedgerError";
import {
  DAML_TEMPLATE_MODULE,
  DAML_TEMPLATE_ENTITY,
  DAML_TEMPLATE_ENTITY_CASH_HOLDING,
  DAML_CHOICE_CONFIRM_DELIVERY,
  DAML_CHOICE_FAIL_OR_EXPIRE,
  DAML_CHOICE_FUND_ESCROW,
  DAML_PARTY_OPERATOR,
  DAML_PARTY_BUYER,
  DAML_PARTY_SUPPLIER,
} from "../config/constants";

interface Parties {
  operator: string;
  buyer: string;
  supplier: string;
}

let cachedEscrowTemplateId: string | null = null;
let cachedCashHoldingTemplateId: string | null = null;
let cachedParties: Parties | null = null;

function getEscrowTemplateId(): string {
  if (!cachedEscrowTemplateId) {
    cachedEscrowTemplateId = `${resolvePackageId()}:${DAML_TEMPLATE_MODULE}:${DAML_TEMPLATE_ENTITY}`;
  }
  return cachedEscrowTemplateId;
}

function getCashHoldingTemplateId(): string {
  if (!cachedCashHoldingTemplateId) {
    cachedCashHoldingTemplateId = `${resolvePackageId()}:${DAML_TEMPLATE_MODULE}:${DAML_TEMPLATE_ENTITY_CASH_HOLDING}`;
  }
  return cachedCashHoldingTemplateId;
}

// The demo runs a single backend service acting as one Operator party, with
// one Buyer party and one Supplier party allocated by Escrow.daml's init
// script when `daml start` boots the sandbox. Real multi-tenant party
// management is out of scope for the hackathon demo - individual wallets
// are identified by the plain-text walletId field on CashHolding/Escrow,
// not by having their own Daml party.
async function getParties(): Promise<Parties> {
  if (cachedParties) {
    return cachedParties;
  }

  const parties = await cantonClient.listParties();
  const find = (displayName: string): string => {
    const party = parties.find((p) => p.displayName === displayName);
    if (!party) {
      throw new LedgerError(
        `Party "${displayName}" not found on the ledger. Make sure "daml start" ran Escrow:setup.`
      );
    }
    return party.identifier;
  };

  cachedParties = {
    operator: find(DAML_PARTY_OPERATOR),
    buyer: find(DAML_PARTY_BUYER),
    supplier: find(DAML_PARTY_SUPPLIER),
  };
  return cachedParties;
}

export interface CashHolding {
  contractId: string;
  amount: number;
}

// Mirrors Escrow.daml's escrowHoldingWalletId exactly - the special
// walletId used for the CashHolding that represents the real,
// escrow-managed account the 10% margin actually sits in between order
// and delivery, distinct from any real buyer or supplier wallet.
function escrowHoldingWalletId(escrowId: string): string {
  return `ESCROW-${escrowId}`;
}

// There's no indexed lookup by an arbitrary field via the simple Daml JSON
// API, so this fetches every CashHolding the operator can see and filters
// client-side - exactly the same pattern getParties() already uses for
// party lookups. Fine at this data scale.
export async function getCashHolding(walletId: string): Promise<CashHolding | undefined> {
  const templateId = getCashHoldingTemplateId();
  const parties = await getParties();
  const contracts = await cantonClient.query<DamlCashHoldingPayload>(templateId, [parties.operator]);
  const match = contracts.find((contract) => contract.payload.walletId === walletId);
  if (!match) return undefined;
  return { contractId: match.contractId, amount: fromDamlDecimal(match.payload.amount) };
}

// Called once, at Buyer registration - gives a wallet its first real,
// ledger-held balance instead of a number in a database row.
export async function createInitialCashHolding(walletId: string, amount: number): Promise<string> {
  const templateId = getCashHoldingTemplateId();
  const parties = await getParties();
  const payload: DamlCashHoldingPayload = {
    operator: parties.operator,
    walletId,
    amount: toDamlDecimal(amount),
  };
  const contract = await cantonClient.create(templateId, payload, [parties.operator]);
  return contract.contractId;
}

export interface FundEscrowParams {
  buyerWalletId: string;
  orderId: string;
  escrowId: string;
  holdReferenceId: string;
  supplierWalletId: string;
  orderAmount: number;
  marginAmount: number;
  deliverySla: string;
}

// Debits the buyer's CashHolding and creates the Escrow contract as one
// atomic Daml transaction (Escrow.daml's FundEscrow choice) - this is the
// actual fund hold, done for real on the ledger instead of a separate
// backend/CBS step editing a database number.
export async function fundEscrow(params: FundEscrowParams): Promise<string> {
  const cashHoldingTemplateId = getCashHoldingTemplateId();
  const parties = await getParties();

  const holding = await getCashHolding(params.buyerWalletId);
  if (!holding) {
    throw new LedgerError(`No CashHolding found for buyer wallet "${params.buyerWalletId}" - was it registered?`);
  }

  const result = await cantonClient.exercise<string>(
    cashHoldingTemplateId,
    holding.contractId,
    DAML_CHOICE_FUND_ESCROW,
    {
      orderId: params.orderId,
      escrowId: params.escrowId,
      holdReferenceId: params.holdReferenceId,
      buyer: parties.buyer,
      supplier: parties.supplier,
      supplierWalletId: params.supplierWalletId,
      orderAmount: toDamlDecimal(params.orderAmount),
      marginAmount: toDamlDecimal(params.marginAmount),
      deliverySla: params.deliverySla,
    },
    [parties.operator]
  );
  return result.exerciseResult;
}

// Success path: takes the remaining 90% from the buyer's CURRENT holding -
// this is the moment that money actually leaves them, it was never touched
// at order time - releases the 10% margin sitting in the real
// escrow-managed account, and pays the supplier the full order amount (90%
// + 10% combined), atomically alongside marking the escrow Settled. The
// buyer is guaranteed to have a holding by this point (FundEscrow requires
// one to exist), and the escrow-managed account is guaranteed to exist
// too (FundEscrow always creates it) - both looked up as required. The
// supplier may be getting their very first holding, so that lookup stays
// optional.
export async function confirmDelivery(
  contractId: string,
  escrowId: string,
  buyerWalletId: string,
  supplierWalletId: string
): Promise<string> {
  const templateId = getEscrowTemplateId();
  const parties = await getParties();

  const buyerHolding = await getCashHolding(buyerWalletId);
  if (!buyerHolding) {
    throw new LedgerError(`No CashHolding found for buyer wallet "${buyerWalletId}" - this should not happen once an order exists`);
  }
  const escrowHolding = await getCashHolding(escrowHoldingWalletId(escrowId));
  if (!escrowHolding) {
    throw new LedgerError(`No escrow-managed CashHolding found for escrow "${escrowId}" - this should not happen once an order exists`);
  }
  const supplierHolding = await getCashHolding(supplierWalletId);

  const result = await cantonClient.exercise<string>(
    templateId,
    contractId,
    DAML_CHOICE_CONFIRM_DELIVERY,
    {
      buyerHoldingCid: buyerHolding.contractId,
      buyerHoldingAmount: toDamlDecimal(buyerHolding.amount),
      escrowHoldingCid: escrowHolding.contractId,
      supplierHoldingCid: supplierHolding ? supplierHolding.contractId : null,
      supplierHoldingAmount: toDamlDecimal(supplierHolding ? supplierHolding.amount : 0),
    },
    [parties.operator]
  );
  return result.exerciseResult;
}

// Failure path: releases the 10% margin sitting in the real escrow-managed
// account back to the buyer - the 90% was never debited from the buyer
// under this model, so there's nothing else to give back. Marks the
// escrow Refunded in the same atomic transaction.
export async function failOrExpireDelivery(contractId: string, escrowId: string, buyerWalletId: string): Promise<string> {
  const templateId = getEscrowTemplateId();
  const parties = await getParties();

  const buyerHolding = await getCashHolding(buyerWalletId);
  if (!buyerHolding) {
    throw new LedgerError(`No CashHolding found for buyer wallet "${buyerWalletId}" - this should not happen once an order exists`);
  }
  const escrowHolding = await getCashHolding(escrowHoldingWalletId(escrowId));
  if (!escrowHolding) {
    throw new LedgerError(`No escrow-managed CashHolding found for escrow "${escrowId}" - this should not happen once an order exists`);
  }

  const result = await cantonClient.exercise<string>(
    templateId,
    contractId,
    DAML_CHOICE_FAIL_OR_EXPIRE,
    {
      buyerHoldingCid: buyerHolding.contractId,
      buyerHoldingAmount: toDamlDecimal(buyerHolding.amount),
      escrowHoldingCid: escrowHolding.contractId,
    },
    [parties.operator]
  );
  return result.exerciseResult;
}

// "heldBalance" for display purposes: the 90% of each still-pending order
// that's been committed but not yet actually taken from the buyer's
// spendable CashHolding (see FundEscrow - only the margin is debited up
// front) - the sum of (orderAmount - marginAmount) across their
// still-EscrowCreated escrows.
export async function getHeldAmountForBuyer(buyerWalletId: string): Promise<number> {
  const templateId = getEscrowTemplateId();
  const parties = await getParties();
  const contracts = await cantonClient.query<DamlEscrowPayload>(templateId, [parties.operator]);
  return contracts
    .filter((contract) => contract.payload.buyerWalletId === buyerWalletId && contract.payload.status === "EscrowCreated")
    .reduce(
      (sum, contract) => sum + (fromDamlDecimal(contract.payload.orderAmount) - fromDamlDecimal(contract.payload.marginAmount)),
      0
    );
}
