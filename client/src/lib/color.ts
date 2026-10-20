import { OrderStatus } from "../types";

export function contrastTextColor(hex: string): "#000000" | "#ffffff" {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return "#ffffff";
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

interface StatusMeta {
  label: string;
  color: string;
}

const STATUS_META: Record<OrderStatus, StatusMeta> = {
  SEATED: { label: "Seated / Ordering", color: "#64748b" },
  PREPARING: { label: "Preparing", color: "#f97316" },
  SERVED: { label: "Served", color: "#3b82f6" },
  PAYMENT_PENDING: { label: "Payment Pending", color: "#eab308" },
  PAYMENT_FULFILLED: { label: "Payment Fulfilled", color: "#16a34a" },
  CANCELLED: { label: "Cancelled", color: "#dc2626" },
};

export function statusMeta(status: OrderStatus): StatusMeta {
  return STATUS_META[status];
}

export const ORDER_STATUSES: OrderStatus[] = [
  "SEATED",
  "PREPARING",
  "SERVED",
  "PAYMENT_PENDING",
  "PAYMENT_FULFILLED",
];
