// Covers order.routes.ts / order.controller.ts / order.service.ts /
// escrow.service.ts - the full Buyer creates -> Supplier confirms ->
// Logistics reports delivery -> Buyer verifies lifecycle, the ownership and
// state guards along the way, and the resulting activity log entries.
import {
  api,
  registerWallet,
  addProduct,
  createOrder,
  confirmOrder,
  reportDelivery,
  verifyDelivery,
  loginLogistics,
  getBalance,
} from "./helpers";

async function setUpConfirmedOrder(price = 100000, marginPercent = 10) {
  const buyer = await registerWallet("Buyer");
  const supplier = await registerWallet("Supplier");
  // Snapshot balances before the order touches either wallet at all - the
  // margin is already debited by the time setUpConfirmedOrder returns, so a
  // caller wanting the TRUE pre-order balance can't just call getBalance()
  // afterwards.
  const buyerBeforeOrder = await getBalance(buyer.walletId, "9999");
  const supplierBeforeOrder = await getBalance(supplier.walletId, "9999");
  const product = await addProduct(supplier.token, { price, escrowMarginPercent: marginPercent });
  const orderRes = await createOrder(buyer.token, supplier.walletId, product.id);
  const orderId = orderRes.body.data.id;
  await confirmOrder(supplier.token, orderId);
  return { buyer, supplier, product, orderId, buyerBeforeOrder, supplierBeforeOrder };
}

async function getActivityTitles(): Promise<string[]> {
  const res = await api.get("/api/v1/dashboard/summary");
  return (res.body.data.activities as { title: string }[]).map((a) => a.title);
}

describe("Create order", () => {
  it("starts a new order as AwaitingConfirmation / Active / Pending", async () => {
    const buyer = await registerWallet("Buyer");
    const supplier = await registerWallet("Supplier");
    const product = await addProduct(supplier.token);

    const res = await createOrder(buyer.token, supplier.walletId, product.id);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("Active");
    expect(res.body.data.settlement).toBe("Pending");
    expect(res.body.data.fulfillmentStatus).toBe("AwaitingConfirmation");
  });

  it("rejects an order larger than the buyer's current holding", async () => {
    const buyer = await registerWallet("Buyer");
    const supplier = await registerWallet("Supplier");
    const product = await addProduct(supplier.token, { price: 999999999999, escrowMarginPercent: 10 });

    const res = await createOrder(buyer.token, supplier.walletId, product.id);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("writes a 'Created Order' entry to the activity log", async () => {
    const buyer = await registerWallet("Buyer");
    const supplier = await registerWallet("Supplier");
    const product = await addProduct(supplier.token);
    const orderRes = await createOrder(buyer.token, supplier.walletId, product.id);

    const titles = await getActivityTitles();
    expect(titles.some((t) => t.includes(orderRes.body.data.id) && t.includes("Created Order"))).toBe(true);
  });
});

describe("Confirm order (Supplier)", () => {
  it("moves the order to Confirmed", async () => {
    const buyer = await registerWallet("Buyer");
    const supplier = await registerWallet("Supplier");
    const product = await addProduct(supplier.token);
    const orderRes = await createOrder(buyer.token, supplier.walletId, product.id);

    const res = await confirmOrder(supplier.token, orderRes.body.data.id);

    expect(res.status).toBe(200);
    expect(res.body.data.fulfillmentStatus).toBe("Confirmed");
  });

  it("rejects a different Supplier confirming someone else's order", async () => {
    const buyer = await registerWallet("Buyer");
    const supplierA = await registerWallet("Supplier");
    const supplierB = await registerWallet("Supplier");
    const product = await addProduct(supplierA.token);
    const orderRes = await createOrder(buyer.token, supplierA.walletId, product.id);

    const res = await confirmOrder(supplierB.token, orderRes.body.data.id);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/does not belong to this Supplier account/);
  });

  it("writes an 'Order Confirmed' entry to the activity log", async () => {
    const { orderId } = await setUpConfirmedOrder();
    const titles = await getActivityTitles();
    expect(titles.some((t) => t.includes(orderId) && t.includes("Confirmed"))).toBe(true);
  });
});

describe("Report delivery (Logistics)", () => {
  it("rejects reporting delivery before the Supplier has confirmed", async () => {
    const logisticsToken = await loginLogistics();
    const buyer = await registerWallet("Buyer");
    const supplier = await registerWallet("Supplier");
    const product = await addProduct(supplier.token);
    const orderRes = await createOrder(buyer.token, supplier.walletId, product.id);

    const res = await reportDelivery(logisticsToken, orderRes.body.data.id, "Delivered");

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.message).toMatch(/not yet Confirmed by the Supplier/);
  });

  it("moves a Delivered order to AwaitingBuyerVerification without moving any money", async () => {
    const logisticsToken = await loginLogistics();
    const { buyer, orderId } = await setUpConfirmedOrder();
    const before = await getBalance(buyer.walletId, "9999");

    const res = await reportDelivery(logisticsToken, orderId, "Delivered");

    expect(res.body.data.status).toBe("Active");
    expect(res.body.data.fulfillmentStatus).toBe("AwaitingBuyerVerification");
    const after = await getBalance(buyer.walletId, "9999");
    expect(after.body.data.availableBalance).toBe(before.body.data.availableBalance);
  });

  it("refunds the buyer immediately when Logistics reports Failed, bypassing Buyer verification entirely", async () => {
    const logisticsToken = await loginLogistics();
    const { buyer, orderId, buyerBeforeOrder } = await setUpConfirmedOrder();

    const res = await reportDelivery(logisticsToken, orderId, "Failed");

    expect(res.body.data.status).toBe("Cancelled");
    expect(res.body.data.fulfillmentStatus).toBe("DeliveryFailed");
    const after = await getBalance(buyer.walletId, "9999");
    expect(after.body.data.availableBalance).toBe(buyerBeforeOrder.body.data.availableBalance);
  });

  it("rejects reporting delivery twice on the same order", async () => {
    const logisticsToken = await loginLogistics();
    const { orderId } = await setUpConfirmedOrder();
    await reportDelivery(logisticsToken, orderId, "Failed");

    const secondAttempt = await reportDelivery(logisticsToken, orderId, "Failed");

    expect(secondAttempt.status).toBeGreaterThanOrEqual(400);
  });
});

describe("Verify delivery (Buyer)", () => {
  it("rejects verifying before Logistics has reported Delivered", async () => {
    const { buyer, orderId } = await setUpConfirmedOrder();
    const res = await verifyDelivery(buyer.token, orderId, true);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.message).toMatch(/not awaiting Buyer verification/);
  });

  it("rejects a different Buyer verifying someone else's order", async () => {
    const logisticsToken = await loginLogistics();
    const { orderId } = await setUpConfirmedOrder();
    await reportDelivery(logisticsToken, orderId, "Delivered");
    const someoneElse = await registerWallet("Buyer");

    const res = await verifyDelivery(someoneElse.token, orderId, true);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/does not belong to this Buyer account/);
  });

  it("Product Verified: pays the supplier in full and net-debits the buyer the full order amount", async () => {
    const logisticsToken = await loginLogistics();
    const { buyer, supplier, orderId, buyerBeforeOrder, supplierBeforeOrder } = await setUpConfirmedOrder(
      100000,
      10
    );
    await reportDelivery(logisticsToken, orderId, "Delivered");

    const res = await verifyDelivery(buyer.token, orderId, true);

    expect(res.body.data.status).toBe("Completed");
    expect(res.body.data.settlement).toBe("Released");
    expect(res.body.data.fulfillmentStatus).toBe("ProductVerified");
    const buyerAfter = await getBalance(buyer.walletId, "9999");
    const supplierAfter = await getBalance(supplier.walletId, "9999");
    // Measured from BEFORE the order even existed - not just from the
    // moment settlement started - so this captures the full 90%+10%
    // combined debit, not only the 90% ConfirmDelivery takes at this step.
    expect(buyerBeforeOrder.body.data.availableBalance - buyerAfter.body.data.availableBalance).toBe(100000);
    expect(supplierAfter.body.data.availableBalance - supplierBeforeOrder.body.data.availableBalance).toBe(
      100000
    );
  });

  it("Product Failed: refunds the buyer back to their exact original balance", async () => {
    const logisticsToken = await loginLogistics();
    const { buyer, orderId, buyerBeforeOrder } = await setUpConfirmedOrder(100000, 10);
    await reportDelivery(logisticsToken, orderId, "Delivered");

    const res = await verifyDelivery(buyer.token, orderId, false);

    expect(res.body.data.status).toBe("Cancelled");
    expect(res.body.data.settlement).toBe("Refunded");
    expect(res.body.data.fulfillmentStatus).toBe("ProductFailed");
    const after = await getBalance(buyer.walletId, "9999");
    // Refunding the margin on top of the 90% that was never taken should
    // land exactly back on the balance from before the order was ever placed.
    expect(after.body.data.availableBalance).toBe(buyerBeforeOrder.body.data.availableBalance);
  });

  it("rejects verifying the same order twice", async () => {
    const logisticsToken = await loginLogistics();
    const { buyer, orderId } = await setUpConfirmedOrder();
    await reportDelivery(logisticsToken, orderId, "Delivered");
    await verifyDelivery(buyer.token, orderId, true);

    const secondAttempt = await verifyDelivery(buyer.token, orderId, true);

    expect(secondAttempt.status).toBeGreaterThanOrEqual(400);
    // fulfillmentStatus is now the FIRST guard to catch a repeat call (it's
    // already "ProductVerified", not "AwaitingBuyerVerification") - the
    // separate order.status !== "Active" guard exists as a second layer for
    // paths where fulfillmentStatus alone wouldn't be enough, but isn't
    // what fires for this specific repeat-verify case.
    expect(secondAttempt.body.message).toMatch(/not awaiting Buyer verification/);
  });
});
