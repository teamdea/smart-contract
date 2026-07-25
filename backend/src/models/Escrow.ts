import { EscrowStatus } from "../enums/EscrowStatus";

export interface EscrowRecord {
  escrowId: string;
  orderId: string;
  contractId: string;
  holdReferenceId: string;
  orderAmount: number;
  marginAmount: number;
  status: EscrowStatus;
  createdAt: string;
  updatedAt: string;
}
