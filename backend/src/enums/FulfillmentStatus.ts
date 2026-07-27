// Off-chain shipment lifecycle, independent of OrderStatus (escrow/payment
// state) and EscrowStatus (Daml contract state). AwaitingConfirmation ->
// Confirmed when the Supplier acknowledges the order - that's also what
// makes Logistics show it as "In Transit" and unlocks Mark Delivered/Failed.
export type FulfillmentStatus = "AwaitingConfirmation" | "Confirmed";
