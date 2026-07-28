// Off-chain shipment lifecycle, independent of OrderStatus (escrow/payment
// state) and EscrowStatus (Daml contract state).
// AwaitingConfirmation -> Confirmed when the Supplier acknowledges the
// order - that's also what makes Logistics show it as "In Transit" and
// unlocks Mark Delivered/Failed.
// Confirmed -> AwaitingBuyerVerification when Logistics reports Delivered -
// funds don't move yet at this point. Only the Buyer's own "Product
// Verified"/"Product Failed" action (see escrow.service.ts's
// processBuyerVerification) actually releases or refunds the funds from
// here, moving this to its own terminal state (ProductVerified /
// ProductFailed) - Logistics can only confirm a package physically
// arrived, not that its contents are acceptable.
// Confirmed -> DeliveryFailed when Logistics instead reports the shipment
// never arrived - skips AwaitingBuyerVerification entirely and refunds
// immediately, since there's nothing for the Buyer to inspect in that case.
// This is a different terminal state from ProductFailed because the Buyer
// never made a decision here - Logistics did.
export type FulfillmentStatus =
  | "AwaitingConfirmation"
  | "Confirmed"
  | "AwaitingBuyerVerification"
  | "ProductVerified"
  | "ProductFailed"
  | "DeliveryFailed";
