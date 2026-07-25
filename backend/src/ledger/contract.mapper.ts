import { DamlEscrowStatus } from "./contract.types";
import { EscrowStatus } from "../enums/EscrowStatus";

export function toDamlDecimal(amount: number): string {
  return amount.toFixed(2);
}

export function fromDamlDecimal(value: string): number {
  return parseFloat(value);
}

const DAML_TO_LOCAL_STATUS: Record<DamlEscrowStatus, EscrowStatus> = {
  EscrowCreated: "Created",
  Settled: "Settled",
  Refunded: "Refunded",
};

export function fromDamlStatus(status: DamlEscrowStatus): EscrowStatus {
  return DAML_TO_LOCAL_STATUS[status];
}
