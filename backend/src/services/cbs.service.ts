import crypto from "crypto";
import { CBSException } from "../exceptions/CBSException";
import { walletRepository } from "../repositories/wallet.repository";
import { Wallet } from "../models/Wallet";

// Simulates the Core Banking System box from the architecture diagram
// (Fund Hold API / Settlement API / Release Hold API), backed by a real
// (simulated) wallet ledger - see models/Wallet.ts. There's no real bank
// integration available for the hackathon demo, but balances actually move:
// nothing here is just a fake reference code anymore.
//
// Wallets must already be registered (see auth.controller.ts) before any of
// these are called - order.service.ts checks that before reaching here, so
// a missing wallet at this point means something upstream skipped that
// check, not a normal user-facing error.

function generateReference(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

async function requireWallet(walletId: string): Promise<Wallet> {
  const wallet = await walletRepository.findById(walletId);
  if (!wallet) {
    throw new CBSException(`Wallet ${walletId} is not registered`);
  }
  return wallet;
}

export interface RequestFundHoldParams {
  orderAmount: number;
  marginAmount: number; // the 10% deposited into escrow now
  buyerWalletId: string;
}

export interface SettleParams {
  holdReferenceId: string;
  heldAmount: number; // the 90% lien being released and paid out
  marginAmount: number; // the 10% already in escrow, paid out alongside it
  buyerWalletId: string;
  supplierWalletId: string;
}

export interface ReleaseHoldParams {
  holdReferenceId: string;
  heldAmount: number;
  marginAmount: number;
  buyerWalletId: string;
}

export const cbsService = {
  // Diagram step 4/4a: place a lien for the 90% (frozen, not yet debited)
  // and step 5: actually deposit the 10% margin into escrow now.
  async requestFundHold(params: RequestFundHoldParams): Promise<{ holdReferenceId: string }> {
    const heldAmount = params.orderAmount - params.marginAmount;
    const wallet = await requireWallet(params.buyerWalletId);

    if (wallet.availableBalance < params.orderAmount) {
      throw new CBSException(
        `Insufficient funds in ${params.buyerWalletId}: available ₹${wallet.availableBalance.toLocaleString("en-IN")}, need ₹${params.orderAmount.toLocaleString("en-IN")}`,
        400
      );
    }

    await walletRepository.update(params.buyerWalletId, {
      // 10% margin leaves available balance entirely (moved into escrow).
      // 90% moves from available into held (a lien - still the buyer's
      // money, just frozen).
      availableBalance: wallet.availableBalance - params.orderAmount,
      heldBalance: wallet.heldBalance + heldAmount,
    });

    return { holdReferenceId: generateReference("HOLD") };
  },

  // Success path: actually debit the 90% lien and pay the supplier the
  // full 100% (90% held + 10% margin that was already in escrow).
  async settle(params: SettleParams): Promise<{ settlementReference: string }> {
    if (!params.holdReferenceId) {
      throw new CBSException("Missing hold reference for settlement");
    }

    const buyerWallet = await requireWallet(params.buyerWalletId);
    await walletRepository.update(params.buyerWalletId, {
      heldBalance: Math.max(0, buyerWallet.heldBalance - params.heldAmount),
    });

    const supplierWallet = await requireWallet(params.supplierWalletId);
    await walletRepository.update(params.supplierWalletId, {
      availableBalance: supplierWallet.availableBalance + params.heldAmount + params.marginAmount,
    });

    return { settlementReference: generateReference("STL") };
  },

  // Failure path: unfreeze the 90% lien and refund the 10% margin - the
  // buyer ends up exactly where they started.
  async releaseHold(params: ReleaseHoldParams): Promise<{ releaseReference: string }> {
    if (!params.holdReferenceId) {
      throw new CBSException("Missing hold reference for release");
    }

    const wallet = await requireWallet(params.buyerWalletId);
    await walletRepository.update(params.buyerWalletId, {
      heldBalance: Math.max(0, wallet.heldBalance - params.heldAmount),
      availableBalance: wallet.availableBalance + params.heldAmount + params.marginAmount,
    });

    return { releaseReference: generateReference("REL") };
  },
};
