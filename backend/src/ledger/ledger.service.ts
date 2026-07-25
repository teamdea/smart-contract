import { cantonClient } from "./canton.client";
import { resolvePackageId } from "./packageId";
import { toDamlDecimal } from "./contract.mapper";
import { DamlEscrowPayload } from "./contract.types";
import { LedgerError } from "../exceptions/LedgerError";
import {
  DAML_TEMPLATE_MODULE,
  DAML_TEMPLATE_ENTITY,
  DAML_CHOICE_CONFIRM_DELIVERY,
  DAML_CHOICE_FAIL_OR_EXPIRE,
  DAML_PARTY_OPERATOR,
  DAML_PARTY_BUYER,
  DAML_PARTY_SUPPLIER,
} from "../config/constants";

interface Parties {
  operator: string;
  buyer: string;
  supplier: string;
}

let cachedTemplateId: string | null = null;
let cachedParties: Parties | null = null;

function getTemplateId(): string {
  if (!cachedTemplateId) {
    cachedTemplateId = `${resolvePackageId()}:${DAML_TEMPLATE_MODULE}:${DAML_TEMPLATE_ENTITY}`;
  }
  return cachedTemplateId;
}

// The demo runs a single backend service acting as one Operator party, with
// one Buyer party and one Supplier party allocated by Escrow.daml's init
// script when `daml start` boots the sandbox. Real multi-tenant party
// management is out of scope for the hackathon demo.
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

export interface CreateEscrowParams {
  orderId: string;
  escrowId: string;
  holdReferenceId: string;
  buyerWalletId: string;
  supplierWalletId: string;
  orderAmount: number;
  marginAmount: number;
  deliverySla: string;
}

export async function createEscrowContract(params: CreateEscrowParams): Promise<string> {
  const templateId = getTemplateId();
  const parties = await getParties();

  const payload: DamlEscrowPayload = {
    operator: parties.operator,
    buyer: parties.buyer,
    supplier: parties.supplier,
    orderId: params.orderId,
    escrowId: params.escrowId,
    holdReferenceId: params.holdReferenceId,
    buyerWalletId: params.buyerWalletId,
    supplierWalletId: params.supplierWalletId,
    orderAmount: toDamlDecimal(params.orderAmount),
    marginAmount: toDamlDecimal(params.marginAmount),
    deliverySla: params.deliverySla,
    status: "EscrowCreated",
  };

  const contract = await cantonClient.create(templateId, payload, [parties.operator]);
  return contract.contractId;
}

export async function confirmDelivery(contractId: string): Promise<string> {
  const templateId = getTemplateId();
  const parties = await getParties();
  const result = await cantonClient.exercise<string>(
    templateId,
    contractId,
    DAML_CHOICE_CONFIRM_DELIVERY,
    {},
    [parties.operator]
  );
  return result.exerciseResult;
}

export async function failOrExpireDelivery(contractId: string): Promise<string> {
  const templateId = getTemplateId();
  const parties = await getParties();
  const result = await cantonClient.exercise<string>(
    templateId,
    contractId,
    DAML_CHOICE_FAIL_OR_EXPIRE,
    {},
    [parties.operator]
  );
  return result.exerciseResult;
}
