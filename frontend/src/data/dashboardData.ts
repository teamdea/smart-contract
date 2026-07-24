export interface SummaryCardData {
  title: string;
  value: string;
}

export interface OrderData {
  id: string;
  customer: string;
  amount: string;
  escrow: "Active" | "Released";
  settlement: "Pending" | "Completed" | "In Progress";
}

export interface PlatformStatusData {
  service: string;
  status: string;
}

export interface ActivityData {
  title: string;
  time: string;
}

export const summaryCards: SummaryCardData[] = [
  {
    title: "Total Orders",
    value: "12",
  },
  {
    title: "Active Escrows",
    value: "9",
  },
  {
    title: "Settlement Value",
    value: "₹5.80 Cr",
  },
  {
    title: "Completed Orders",
    value: "7",
  },
];

export const recentOrders: OrderData[] = [
  {
    id: "ORD-1001",
    customer: "ABC Manufacturing",
    amount: "₹1.00 Cr",
    escrow: "Active",
    settlement: "Pending",
  },
  {
    id: "ORD-1002",
    customer: "XYZ Industries",
    amount: "₹80 L",
    escrow: "Released",
    settlement: "Completed",
  },
  {
    id: "ORD-1003",
    customer: "Tech Solutions",
    amount: "₹50 L",
    escrow: "Active",
    settlement: "In Progress",
  },
];

export const platformStatus: PlatformStatusData[] = [
  {
    service: "Orders Processing",
    status: "Healthy",
  },
  {
    service: "Escrow Contracts",
    status: "Healthy",
  },
  {
    service: "Settlement Engine",
    status: "Running",
  },
  {
    service: "Delivery Verification",
    status: "Online",
  },
];

export const activities: ActivityData[] = [
  {
    title: "Created Order ORD-1003",
    time: "5 mins ago",
  },
  {
    title: "Escrow Released for ORD-1002",
    time: "18 mins ago",
  },
  {
    title: "Settlement Completed",
    time: "42 mins ago",
  },
];