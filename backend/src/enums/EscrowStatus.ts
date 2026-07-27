// Mirrors Escrow.daml's EscrowStatus (Created is renamed to avoid clashing
// with Daml.Script's own Created type there; kept as "Created" here since
// there's no such collision in TypeScript).
export type EscrowStatus = "Created" | "Settled" | "Refunded";
