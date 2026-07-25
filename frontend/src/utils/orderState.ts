import type { Order } from "../services/api";

// The architecture diagram's "State Dashboard" defines five real-time
// states: Escrow Created -> Fund Hold Active (90%) -> Delivery Pending ->
// Payment Settled | Refunded. Order creation places the fund hold and
// records the escrow contract atomically in one request (see
// order.service.ts), so those first two states are always both true the
// moment an order exists - there's no observable gap between them given the
// current synchronous flow. This derives the single furthest-reached state
// from data already tracked (order.status), no new backend state needed.
export type OrderLifecycleState =
  | "Escrow Created"
  | "Fund Hold Active (90%)"
  | "Delivery Pending"
  | "Payment Settled"
  | "Refunded";

export type OrderLifecycleColor = "info" | "warning" | "success" | "error";

const COLOR_BY_STATE: Record<OrderLifecycleState, OrderLifecycleColor> = {
  "Escrow Created": "info",
  "Fund Hold Active (90%)": "info",
  "Delivery Pending": "warning",
  "Payment Settled": "success",
  Refunded: "error",
};

export function getOrderLifecycleState(order: Order): OrderLifecycleState {
  if (order.status === "Completed") return "Payment Settled";
  if (order.status === "Cancelled") return "Refunded";
  // status is "Active" (or "Pending", not currently produced by the backend)
  return "Delivery Pending";
}

export function getOrderLifecycleColor(state: OrderLifecycleState): OrderLifecycleColor {
  return COLOR_BY_STATE[state];
}
