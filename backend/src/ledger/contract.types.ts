// Mirrors Escrow.daml's EscrowStatus constructors exactly (as serialized by
// the Daml JSON API: a no-argument ADT constructor becomes a plain string).
export type DamlEscrowStatus = "EscrowCreated" | "Settled" | "Refunded";

export interface DamlEscrowPayload {
  operator: string;
  buyer: string;
  supplier: string;
  orderId: string;
  escrowId: string;
  holdReferenceId: string;
  buyerWalletId: string;
  supplierWalletId: string;
  orderAmount: string; // Daml Decimal is serialized as a string
  marginAmount: string;
  deliverySla: string;
  status: DamlEscrowStatus;
}

// A wallet's real, ledger-held balance - see Escrow.daml's CashHolding
// template. Exactly one live (non-archived) contract exists per wallet.
export interface DamlCashHoldingPayload {
  operator: string;
  walletId: string;
  amount: string; // Daml Decimal is serialized as a string
}

export interface DamlContract<TPayload> {
  contractId: string;
  templateId: string;
  payload: TPayload;
  signatories: string[];
  observers: string[];
}

export interface DamlParty {
  identifier: string;
  displayName?: string;
  isLocal: boolean;
}
