import { OrderStatus } from "../enums/OrderStatus";
import { PaymentStatus } from "../enums/PaymentStatus";

// Field names match what frontend/src/pages/Orders.tsx already renders,
// so the frontend only needs its data source swapped, not its shape.
export interface Order {
  id: string;
  buyer: string;
  merchant: string;
  amount: number;
  escrow: number;
  status: OrderStatus;
  settlement: PaymentStatus;
  createdOn: string;

  escrowId: string;
  holdReferenceId: string;
  deliverySla: string;
  buyerWalletId: string;
  supplierWalletId: string;
}
