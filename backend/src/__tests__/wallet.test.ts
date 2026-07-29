// Covers wallet.routes.ts / wallet.controller.ts - reading a wallet's real
// ledger-held balance, the account-number step-up check, and the
// deferred-debit rule (only the margin moves, and only once the Supplier
// confirms - not at order creation).
import { registerWallet, addProduct, createOrder, confirmOrder, getBalance } from "./helpers";

describe("Balance check", () => {
  it("gives a newly registered Buyer a real starting balance", async () => {
    const buyer = await registerWallet("Buyer");
    const res = await getBalance(buyer.walletId, "9999");

    expect(res.status).toBe(200);
    expect(res.body.data.availableBalance).toBeGreaterThan(0);
  });

  it("returns the same balance on two reads with nothing happening in between", async () => {
    const buyer = await registerWallet("Buyer");
    const first = await getBalance(buyer.walletId, "9999");
    const second = await getBalance(buyer.walletId, "9999");
    expect(first.body.data.availableBalance).toBe(second.body.data.availableBalance);
  });

  it("never includes pin or accountNumber in the response", async () => {
    const buyer = await registerWallet("Buyer");
    const res = await getBalance(buyer.walletId, "9999");
    expect(res.body.data).not.toHaveProperty("pin");
    expect(res.body.data).not.toHaveProperty("accountNumber");
  });
});

describe("Account-number step-up check", () => {
  it("rejects the correct walletId with the wrong account number", async () => {
    const buyer = await registerWallet("Buyer");
    const res = await getBalance(buyer.walletId, "0000");
    expect(res.status).toBe(404);
  });

  it("gives an unknown wallet the exact same rejection message (no enumeration)", async () => {
    const buyer = await registerWallet("Buyer");
    const wrongAccount = await getBalance(buyer.walletId, "0000");
    const unknownWallet = await getBalance("WALLET-DOES-NOT-EXIST", "0000");
    expect(wrongAccount.body.message).toBe(unknownWallet.body.message);
  });
});

describe("Deferred debit - only the margin moves, only at confirmation", () => {
  it("does not touch the buyer's balance while the order is only Pending", async () => {
    const buyer = await registerWallet("Buyer");
    const supplier = await registerWallet("Supplier");
    const before = await getBalance(buyer.walletId, "9999");

    const product = await addProduct(supplier.token, { price: 100000, escrowMarginPercent: 10 });
    await createOrder(buyer.token, supplier.walletId, product.id);

    const after = await getBalance(buyer.walletId, "9999");
    expect(after.body.data.availableBalance).toBe(before.body.data.availableBalance);
  });

  it("debits exactly the product's margin once the Supplier confirms - not the full order amount", async () => {
    const buyer = await registerWallet("Buyer");
    const supplier = await registerWallet("Supplier");
    const before = await getBalance(buyer.walletId, "9999");

    const product = await addProduct(supplier.token, { price: 100000, escrowMarginPercent: 10 });
    const orderRes = await createOrder(buyer.token, supplier.walletId, product.id);
    await confirmOrder(supplier.token, orderRes.body.data.id);

    const after = await getBalance(buyer.walletId, "9999");
    const expectedMargin = Math.round((product.price * product.escrowMarginPercent) / 100);

    expect(before.body.data.availableBalance - after.body.data.availableBalance).toBe(expectedMargin);
  });

  it("does not appear under heldOrders until the Supplier confirms", async () => {
    const buyer = await registerWallet("Buyer");
    const supplier = await registerWallet("Supplier");
    const product = await addProduct(supplier.token, { price: 100000, escrowMarginPercent: 10 });
    const orderRes = await createOrder(buyer.token, supplier.walletId, product.id);

    const balanceWhilePending = await getBalance(buyer.walletId, "9999");
    const entryWhilePending = balanceWhilePending.body.data.heldOrders.find(
      (o: { orderId: string }) => o.orderId === orderRes.body.data.id
    );
    expect(entryWhilePending).toBeUndefined();

    await confirmOrder(supplier.token, orderRes.body.data.id);

    const balanceAfterConfirm = await getBalance(buyer.walletId, "9999");
    expect(balanceAfterConfirm.body.data.escrowedBalance).toBeGreaterThanOrEqual(10000);
    const entryAfterConfirm = balanceAfterConfirm.body.data.heldOrders.find(
      (o: { orderId: string }) => o.orderId === orderRes.body.data.id
    );
    expect(entryAfterConfirm).toBeDefined();
    expect(entryAfterConfirm.heldAmount).toBe(90000);
  });
});
