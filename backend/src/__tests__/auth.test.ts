// Covers auth.routes.ts / auth.controller.ts / session.service.ts /
// middleware/role.middleware.ts - registration, login, and the
// Authorization-header session/role checks every other route relies on.
import { api, registerWallet, uniqueSuffix } from "./helpers";

describe("Register", () => {
  it("creates a wallet and returns a session token", async () => {
    const walletId = `WALLET-BUYER-JEST${uniqueSuffix()}`;
    const res = await api.post("/api/v1/auth/register").send({
      walletId,
      ownerName: "Jest Buyer",
      role: "Buyer",
      pin: "1234",
      accountNumber: "9999",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.walletId).toBe(walletId);
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data.token.length).toBeGreaterThan(0);
  });

  it("rejects a walletId that's already registered", async () => {
    const buyer = await registerWallet("Buyer");

    const res = await api.post("/api/v1/auth/register").send({
      walletId: buyer.walletId,
      ownerName: "Someone Else",
      role: "Buyer",
      pin: "0000",
      accountNumber: "0000",
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it("never echoes pin or accountNumber back in the response", async () => {
    const walletId = `WALLET-BUYER-JEST${uniqueSuffix()}`;
    const res = await api.post("/api/v1/auth/register").send({
      walletId,
      ownerName: "Jest Buyer",
      role: "Buyer",
      pin: "1234",
      accountNumber: "9999",
    });

    expect(res.body.data).not.toHaveProperty("pin");
    expect(res.body.data).not.toHaveProperty("accountNumber");
  });
});

describe("Login", () => {
  it("issues a session token for the correct walletId + PIN", async () => {
    const buyer = await registerWallet("Buyer");
    const res = await api.post("/api/v1/auth/login").send({ walletId: buyer.walletId, pin: "1234" });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data).not.toHaveProperty("pin");
    expect(res.body.data).not.toHaveProperty("accountNumber");
  });

  it("rejects a wrong PIN with a generic message", async () => {
    const buyer = await registerWallet("Buyer");
    const res = await api.post("/api/v1/auth/login").send({ walletId: buyer.walletId, pin: "0000" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects the wrong PIN for the fixed Logistics identity too", async () => {
    const res = await api
      .post("/api/v1/auth/login")
      .send({ walletId: "WALLET-LOGISTICS-MAIN01", pin: "wrong-pin" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("Session / role enforcement (requireRole middleware)", () => {
  it("rejects a state-changing call with no Authorization header", async () => {
    const res = await api.post("/api/v1/orders").send({ supplierWalletId: "x", productId: "y" });
    expect(res.status).toBe(401);
  });

  it("rejects a call whose token belongs to the wrong role", async () => {
    const buyer = await registerWallet("Buyer");
    const res = await api
      .post("/api/v1/orders/ORD-DOES-NOT-EXIST/confirm")
      .set("Authorization", `Bearer ${buyer.token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/requires a Supplier account/);
  });

  it("rejects a made-up bearer token", async () => {
    const res = await api
      .post("/api/v1/orders")
      .set("Authorization", "Bearer not-a-real-token")
      .send({ supplierWalletId: "x", productId: "y" });
    expect(res.status).toBe(401);
  });
});
