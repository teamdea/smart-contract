import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
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

export interface Wallet {
  walletId: string;
  ownerName: string;
  role: "Buyer" | "Supplier";
  availableBalance: number;
  heldBalance: number;
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
  buyerName: string;
  merchantName: string;
  orderAmount: number;
  escrowPercent: number;
  buyerWalletId: string;
  supplierWalletId: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function listOrders(): Promise<Order[]> {
  const res = await client.get<ApiEnvelope<Order[]>>("/orders");
  return res.data.data;
}

export async function getOrder(id: string): Promise<Order> {
  const res = await client.get<ApiEnvelope<Order>>(`/orders/${id}`);
  return res.data.data;
}

export interface CreateOrderResult {
  order: Order;
  // Non-null only the first time each wallet is created - never shown
  // again after this response. See services/order.service.ts (backend).
  buyerWalletSecret: string | null;
  supplierWalletSecret: string | null;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const res = await client.post<ApiEnvelope<CreateOrderResult>>("/orders", input);
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

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await client.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary");
  return res.data.data;
}

export async function listWallets(bankOperatorSecret: string): Promise<Wallet[]> {
  const res = await client.get<ApiEnvelope<Wallet[]>>("/wallets", {
    headers: { "X-Bank-Operator-Secret": bankOperatorSecret },
  });
  return res.data.data;
}

// A wallet ID alone doesn't prove ownership (it's shared with counterparties
// on an order) - looking up a balance requires the wallet's own secret/PIN.
export async function lookupWallet(walletId: string, walletSecret: string): Promise<Wallet> {
  const res = await client.post<ApiEnvelope<Wallet>>(`/wallets/${walletId}/lookup`, { walletSecret });
  return res.data.data;
}
