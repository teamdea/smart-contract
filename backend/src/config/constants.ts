// Fixed list of business sectors a Supplier can sell under - shown as a
// dropdown both when a Supplier adds a product and when a Buyer browses by
// category. Kept as a fixed list (not free text) so a Buyer's category
// filter always matches Suppliers exactly - no risk of "Automobile" vs
// "Automobiles" silently failing to match. Mirrored in
// frontend/src/config/productCategories.ts - keep both in sync.
export const PRODUCT_CATEGORIES = ["Automobile", "Electronics", "Textiles", "Machinery", "Agriculture"];

export const DAML_TEMPLATE_MODULE = "Escrow";
export const DAML_TEMPLATE_ENTITY = "Escrow";
export const DAML_TEMPLATE_ENTITY_CASH_HOLDING = "CashHolding";

export const DAML_CHOICE_CONFIRM_DELIVERY = "ConfirmDelivery";
export const DAML_CHOICE_FAIL_OR_EXPIRE = "FailOrExpireDelivery";
export const DAML_CHOICE_FUND_ESCROW = "FundEscrow";

export const DAML_PARTY_OPERATOR = "Operator";
export const DAML_PARTY_BUYER = "Buyer";
export const DAML_PARTY_SUPPLIER = "Supplier";

// Starting simulated balance for a new Buyer account, so demo orders don't
// hit the insufficient-funds check. Suppliers and Logistics accounts start
// at 0 - see walletRepository's startingBalance().
export const STARTING_BUYER_BALANCE = 50000000; // 5 Cr
