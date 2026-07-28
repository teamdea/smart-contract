import crypto from "crypto";
import request from "supertest";
import app from "../app";

// Every test runs against the real Express app in-process (no server needs
// to be listening on a port), which in turn makes real calls to Firestore
// and the Daml JSON API - there is no mock layer for either. `daml start`
// and a valid `gcloud auth login` session must both be active, exactly like
// running the app normally with `npm run dev`.
const api = request(app);

// Unique per test run so repeated `npm test` invocations never collide with
// a previous run's leftover wallets/products in Firestore.
export function uniqueSuffix(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export interface TestWallet {
  walletId: string;
  token: string;
}

export async function registerWallet(role: "Buyer" | "Supplier"): Promise<TestWallet> {
  const walletId = `WALLET-${role.toUpperCase()}-JEST${uniqueSuffix()}`;
  const res = await api.post("/api/v1/auth/register").send({
    walletId,
    ownerName: `Jest ${role} ${walletId}`,
    role,
    pin: "1234",
    accountNumber: "9999",
  });
  if (res.status !== 201) {
    throw new Error(`Failed to register ${role} wallet: ${JSON.stringify(res.body)}`);
  }
  return { walletId, token: res.body.data.token };
}

export async function login(walletId: string, pin: string): Promise<string> {
  const res = await api.post("/api/v1/auth/login").send({ walletId, pin });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${walletId}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

// The seeded Logistics identity (backend/scripts/seed.ts) - shared across
// all tests since Logistics is a single fixed account, not registered
// per-test like Buyer/Supplier.
export async function loginLogistics(): Promise<string> {
  return login("WALLET-LOGISTICS-MAIN01", "333333");
}

export interface TestProduct {
  id: string;
  price: number;
  escrowMarginPercent: number;
}

export async function addProduct(
  supplierToken: string,
  overrides: Partial<{ category: string; name: string; price: number; escrowMarginPercent: number }> = {}
): Promise<TestProduct> {
  const res = await api
    .post("/api/v1/products")
    .set("Authorization", `Bearer ${supplierToken}`)
    .send({
      category: "Electronics",
      name: `Jest Test Product ${uniqueSuffix()}`,
      price: 50000,
      escrowMarginPercent: 10,
      ...overrides,
    });
  if (res.status !== 201) {
    throw new Error(`Failed to add product: ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

export async function createOrder(buyerToken: string, supplierWalletId: string, productId: string) {
  return api
    .post("/api/v1/orders")
    .set("Authorization", `Bearer ${buyerToken}`)
    .send({ supplierWalletId, productId });
}

export async function confirmOrder(supplierToken: string, orderId: string) {
  return api.post(`/api/v1/orders/${orderId}/confirm`).set("Authorization", `Bearer ${supplierToken}`);
}

export async function reportDelivery(logisticsToken: string, orderId: string, status: "Delivered" | "Failed") {
  return api
    .post(`/api/v1/orders/${orderId}/delivery`)
    .set("Authorization", `Bearer ${logisticsToken}`)
    .send({ status });
}

export async function verifyDelivery(buyerToken: string, orderId: string, verified: boolean) {
  return api
    .post(`/api/v1/orders/${orderId}/verify-delivery`)
    .set("Authorization", `Bearer ${buyerToken}`)
    .send({ verified });
}

export async function getOrder(orderId: string) {
  return api.get(`/api/v1/orders/${orderId}`);
}

export async function getBalance(walletId: string, accountNumber: string) {
  return api.post(`/api/v1/wallets/${walletId}/verify-account`).send({ accountNumber });
}

export { api };
