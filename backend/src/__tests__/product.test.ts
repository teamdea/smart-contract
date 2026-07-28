// Covers product.routes.ts / product.controller.ts / product.service.ts -
// adding products to a Supplier's catalog, input validation, and the rule
// that an order's amount/margin always come from the stored product, never
// from whatever the request body claims.
import { registerWallet, addProduct, createOrder, api } from "./helpers";

describe("Add product", () => {
  it("adds a product to the Supplier's own catalog", async () => {
    const supplier = await registerWallet("Supplier");
    const product = await addProduct(supplier.token, { price: 75000, escrowMarginPercent: 20 });

    expect(product.id).toMatch(/^PROD-/);
    expect(product.price).toBe(75000);
    expect(product.escrowMarginPercent).toBe(20);
  });

  it("rejects a margin of 0%", async () => {
    const supplier = await registerWallet("Supplier");
    const res = await api
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${supplier.token}`)
      .send({ category: "Electronics", name: "Bad Product", price: 1000, escrowMarginPercent: 0 });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects a margin over 100%", async () => {
    const supplier = await registerWallet("Supplier");
    const res = await api
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${supplier.token}`)
      .send({ category: "Electronics", name: "Bad Product", price: 1000, escrowMarginPercent: 150 });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects a price of 0", async () => {
    const supplier = await registerWallet("Supplier");
    const res = await api
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${supplier.token}`)
      .send({ category: "Electronics", name: "Bad Product", price: 0, escrowMarginPercent: 10 });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects a category outside the fixed PRODUCT_CATEGORIES list", async () => {
    const supplier = await registerWallet("Supplier");
    const res = await api
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${supplier.token}`)
      .send({ category: "NotARealCategory", name: "Bad Product", price: 1000, escrowMarginPercent: 10 });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects a Buyer trying to add a product", async () => {
    const buyer = await registerWallet("Buyer");
    const res = await api
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({ category: "Electronics", name: "Bad Product", price: 1000, escrowMarginPercent: 10 });
    expect(res.status).toBe(403);
  });
});

describe("Product terms flow into the order untouched", () => {
  it("uses the product's stored price/margin for the order, not a spoofed request body", async () => {
    const buyer = await registerWallet("Buyer");
    const supplier = await registerWallet("Supplier");
    const product = await addProduct(supplier.token, { price: 10000, escrowMarginPercent: 10 });

    const res = await api
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({ supplierWalletId: supplier.walletId, productId: product.id, amount: 1, escrow: 0 });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(10000);
    expect(res.body.data.escrow).toBe(1000);
  });

  it("rejects an order for a product that belongs to a different supplier", async () => {
    const buyer = await registerWallet("Buyer");
    const realSupplier = await registerWallet("Supplier");
    const otherSupplier = await registerWallet("Supplier");
    const product = await addProduct(realSupplier.token);

    const res = await createOrder(buyer.token, otherSupplier.walletId, product.id);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.message).toMatch(/does not belong to supplier/);
  });
});
