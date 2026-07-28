import axios from "axios";
import { getSession } from "./session";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
});

// Protected write endpoints (create order, report delivery) verify who's
// really calling via this bearer token - attach it automatically so every
// request doesn't need to thread it through manually.
client.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

export interface Order {
  id: string;
  buyer: string;
  merchant: string;
  amount: number;
  escrow: number;
  status: "Pending" | "Active" | "Completed" | "Cancelled";
  settlement: "Pending" | "In Progress" | "Released" | "Refunded";
  createdOn: string;
  escrowId: string;
  holdReferenceId: string;
  deliverySla: string;
  buyerWalletId: string;
  supplierWalletId: string;
  fulfillmentStatus:
    | "AwaitingConfirmation"
    | "Confirmed"
    | "AwaitingBuyerVerification"
    | "ProductVerified"
    | "ProductFailed"
    | "DeliveryFailed";
}

export interface EscrowRecord {
  escrowId: string;
  orderId: string;
  contractId: string;
  holdReferenceId: string;
  orderAmount: number;
  marginAmount: number;
  status: "Created" | "Settled" | "Refunded";
  createdAt: string;
  updatedAt: string;
}

export interface HeldOrder {
  orderId: string;
  sellerName: string;
  heldAmount: number;
}

export interface Wallet {
  walletId: string;
  ownerName: string;
  role: "Buyer" | "Supplier" | "Logistics";
  availableBalance: number;
  // Buyer responses only - Supplier/Logistics wallets never hold funds.
  heldBalance?: number;
  escrowedBalance?: number;
  heldOrders?: HeldOrder[];
}

export interface WalletIdentity {
  walletId: string;
  ownerName: string;
  role: "Buyer" | "Supplier" | "Logistics";
  token: string;
}

export interface Product {
  id: string;
  sellerWalletId: string;
  category: string;
  name: string;
  price: number;
  escrowMarginPercent: number;
  createdAt: string;
}

export interface SummaryCardData {
  title: string;
  value: string;
}

export interface PlatformStatusData {
  service: string;
  status: string;
}

export interface ActivityData {
  title: string;
  time: string;
}

export interface ReportsSummary {
  escrowBalance: string;
  successRate: number;
  metrics: {
    settlementCompletion: number;
    smartContractExecution: number;
    oracleVerification: number;
  };
}

export interface DashboardSummary {
  summaryCards: SummaryCardData[];
  platformStatus: PlatformStatusData[];
  activities: ActivityData[];
  recentOrders: Order[];
  reports: ReportsSummary;
}

export interface CreateOrderInput {
  // buyerWalletId is not sent - the backend derives it from the
  // authenticated session (requireRole("Buyer")), so a logged-in buyer
  // can't create an order impersonating another one. orderAmount and the
  // escrow margin aren't sent either - the backend derives both from
  // productId (see product.service.ts), so they can't be tampered with.
  supplierWalletId: string;
  productId: string;
}

export interface RegisterInput {
  walletId: string;
  ownerName: string;
  role: "Buyer" | "Supplier" | "Logistics";
  pin: string;
  accountNumber: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function register(input: RegisterInput): Promise<WalletIdentity> {
  const res = await client.post<ApiEnvelope<WalletIdentity>>("/auth/register", input);
  return res.data.data;
}

export async function login(walletId: string, pin: string): Promise<WalletIdentity> {
  const res = await client.post<ApiEnvelope<WalletIdentity>>("/auth/login", { walletId, pin });
  return res.data.data;
}

// Identity-only directory (no balances) - backs the Supplier dropdown on
// Create Order, so a buyer picks a registered supplier by name. Optionally
// narrowed to Suppliers selling in a specific category.
export async function listWalletsByRole(
  role: "Buyer" | "Supplier",
  category?: string
): Promise<WalletIdentity[]> {
  const res = await client.get<ApiEnvelope<WalletIdentity[]>>("/wallets", {
    params: { role, category },
  });
  return res.data.data;
}

// Public: a seller's product catalog, used both on the Seller's own "My
// Products" page and by Buyers browsing that seller on Create Order.
// Optionally narrowed to one category - a seller can list products across
// more than one category, so Create Order passes the category the buyer
// already picked rather than showing the seller's whole catalog mixed together.
export async function listProductsBySeller(
  sellerWalletId: string,
  category?: string
): Promise<Product[]> {
  const res = await client.get<ApiEnvelope<Product[]>>("/products", {
    params: { sellerWalletId, category },
  });
  return res.data.data;
}

export interface AddProductInput {
  category: string;
  name: string;
  price: number;
  escrowMarginPercent: number;
}

// Supplier-only: adds to the caller's own catalog.
export async function addProduct(input: AddProductInput): Promise<Product> {
  const res = await client.post<ApiEnvelope<Product>>("/products", input);
  return res.data.data;
}

export async function listOrders(): Promise<Order[]> {
  const res = await client.get<ApiEnvelope<Order[]>>("/orders");
  return res.data.data;
}

export async function getOrder(id: string): Promise<Order> {
  const res = await client.get<ApiEnvelope<Order>>(`/orders/${id}`);
  return res.data.data;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const res = await client.post<ApiEnvelope<Order>>("/orders", input);
  return res.data.data;
}

export async function getEscrow(orderId: string): Promise<EscrowRecord> {
  const res = await client.get<ApiEnvelope<EscrowRecord>>(`/escrows/${orderId}`);
  return res.data.data;
}

export async function updateDeliveryStatus(
  orderId: string,
  status: "Delivered" | "Failed"
): Promise<Order> {
  const res = await client.post<ApiEnvelope<Order>>(`/orders/${orderId}/delivery`, { status });
  return res.data.data;
}

// Supplier-only: acknowledges receipt of the order. This is also what hands
// the order to Logistics (shown there as "In Transit").
export async function confirmOrder(orderId: string): Promise<Order> {
  const res = await client.post<ApiEnvelope<Order>>(`/orders/${orderId}/confirm`);
  return res.data.data;
}

// Buyer-only: only callable once Logistics has reported Delivered. This is
// what actually releases funds to the supplier (verified) or refunds the
// buyer (not verified) - Logistics reporting Delivered on its own no
// longer moves any money.
export async function verifyDelivery(orderId: string, verified: boolean): Promise<Order> {
  const res = await client.post<ApiEnvelope<Order>>(`/orders/${orderId}/verify-delivery`, {
    verified,
  });
  return res.data.data;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await client.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary");
  return res.data.data;
}

// A step-up check independent of login: the account number chosen at
// registration, required specifically to view balance on the Wallets page.
export async function verifyWalletAccount(
  walletId: string,
  accountNumber: string
): Promise<Wallet> {
  const res = await client.post<ApiEnvelope<Wallet>>(`/wallets/${walletId}/verify-account`, {
    accountNumber,
  });
  return res.data.data;
}
