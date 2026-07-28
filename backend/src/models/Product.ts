// A seller's catalog entry - price and escrowMarginPercent are set once by
// the seller and are what actually determine an order's amount and margin
// when a buyer orders this product (see order.service.ts's createOrder),
// not anything typed in at order time. Different products can carry very
// different margin rules - a high-value item is expected to need a higher
// margin than a low-value one, but that judgment is the seller's to make
// per product, not a single fixed percentage across everything they sell.
export interface Product {
  id: string;
  sellerWalletId: string;
  category: string;
  name: string;
  price: number;
  escrowMarginPercent: number;
  createdAt: string;
}
