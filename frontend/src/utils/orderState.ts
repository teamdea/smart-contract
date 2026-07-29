import type { Order } from "../services/api";

// Order creation no longer places the fund hold - that only happens once
// the Supplier confirms (see order.service.ts's confirmOrder), so there IS
// now a real, observable gap between an order existing and its escrow
// existing. "Awaiting Confirmation" covers exactly that gap (order.status
// "Pending" - nothing held yet); "Delivery Pending" covers everything from
// Confirmed (escrow funded) through Logistics/Buyer verification.
export type OrderLifecycleState =
  "Awaiting Confirmation" | "Delivery Pending" | "Payment Settled" | "Refunded";

export type OrderLifecycleColor = "info" | "warning" | "success" | "error";

const COLOR_BY_STATE: Record<OrderLifecycleState, OrderLifecycleColor> = {
  "Awaiting Confirmation": "info",
  "Delivery Pending": "warning",
  "Payment Settled": "success",
  Refunded: "error",
};

export function getOrderLifecycleState(order: Order): OrderLifecycleState {
  if (order.status === "Completed") return "Payment Settled";
  if (order.status === "Cancelled") return "Refunded";
  if (order.status === "Pending") return "Awaiting Confirmation";
  return "Delivery Pending";
}

export function getOrderLifecycleColor(state: OrderLifecycleState): OrderLifecycleColor {
  return COLOR_BY_STATE[state];
}
