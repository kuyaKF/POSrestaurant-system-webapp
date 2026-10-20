import { apiGet, apiSend } from "./client";
import { DiscountType, Order, OrderStatus } from "../types";

export function fetchOrders(opts?: { status?: OrderStatus | OrderStatus[]; since?: Date }): Promise<Order[]> {
  const params = new URLSearchParams();
  if (opts?.status) {
    const statuses = Array.isArray(opts.status) ? opts.status : [opts.status];
    params.set("status", statuses.join(","));
  }
  if (opts?.since) params.set("since", opts.since.toISOString());
  const query = params.toString();
  return apiGet<Order[]>(`/api/orders${query ? `?${query}` : ""}`);
}

export function fetchOrder(id: number): Promise<Order> {
  return apiGet<Order>(`/api/orders/${id}`);
}

export type CreateOrderInput =
  | { orderType: "DINE_IN"; tableId: number; partySize: number; serverId: number }
  | { orderType: "TAKEOUT"; serverId: number };

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiSend<Order>("/api/orders", "POST", input);
}

export function addOrderItem(
  orderId: number,
  input: { menuItemId: number; quantity: number; notes?: string | null }
): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/items`, "POST", input);
}

export function updateOrderItem(orderId: number, itemId: number, quantity: number): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/items/${itemId}`, "PATCH", { quantity });
}

export function setOrderItemNotes(orderId: number, itemId: number, notes: string | null): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/items/${itemId}/notes`, "PATCH", { notes });
}

export function removeOrderItem(orderId: number, itemId: number): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/items/${itemId}`, "DELETE");
}

export function setOrderItemReady(orderId: number, itemId: number, ready: boolean): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/items/${itemId}/ready`, "PATCH", { ready });
}

export function setOrderItemServed(
  orderId: number,
  itemId: number,
  served: boolean,
  staffId: number
): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/items/${itemId}/served`, "PATCH", { served, staffId });
}

export function setOrderItemTakeout(orderId: number, itemId: number, isTakeout: boolean): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/items/${itemId}/takeout`, "PATCH", { isTakeout });
}

export function addOrderCombo(
  orderId: number,
  input: { comboId: number; selections: { slotId: number; menuItemId: number }[] }
): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/combos`, "POST", input);
}

export function removeOrderCombo(orderId: number, comboInstanceId: number): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/combos/${comboInstanceId}`, "DELETE");
}

export function setOrderComboTakeout(orderId: number, comboInstanceId: number, isTakeout: boolean): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/combos/${comboInstanceId}/takeout`, "PATCH", { isTakeout });
}

export function setOrderDiscount(
  orderId: number,
  input: { discountType: DiscountType | null; idNumber?: string | null; name?: string | null }
): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/discount`, "PATCH", input);
}

export function submitOrder(orderId: number, staffId: number): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/submit`, "POST", { staffId });
}

export function cancelOrder(orderId: number, staffId: number): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/cancel`, "POST", { staffId });
}

export function serveReadyItems(orderId: number, staffId: number): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/serve-ready-items`, "POST", { staffId });
}

export function reopenOrder(orderId: number, staffId: number): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/reopen`, "POST", { staffId });
}

export function requestPayment(orderId: number, staffId: number): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/request-payment`, "POST", { staffId });
}

export function completePayment(orderId: number, staffId: number): Promise<Order> {
  return apiSend<Order>(`/api/orders/${orderId}/complete-payment`, "POST", { staffId });
}
