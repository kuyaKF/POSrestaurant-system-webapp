import { useEffect, useState } from "react";
import { Order } from "../types";
import * as ordersApi from "../api/orders";
import { ApiError } from "../api/client";
import { useOrderEvents } from "./useOrderEvents";

export function useOrder(orderId: number) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const load = (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    ordersApi
      .fetchOrder(orderId)
      .then(setOrder)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load order"))
      .finally(() => {
        if (!opts?.silent) setLoading(false);
      });
  };

  useEffect(() => load(), [orderId]);
  // Background refreshes (from our own mutations echoing back, or someone
  // else touching this order) update quietly — no full-page loading flash.
  useOrderEvents(() => load({ silent: true }));

  async function runMutation(fn: () => Promise<Order>) {
    setMutating(true);
    setError(null);
    try {
      const updated = await fn();
      setOrder(updated);
      return updated;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
      throw e;
    } finally {
      setMutating(false);
    }
  }

  return {
    order,
    loading,
    error,
    mutating,
    reload: load,
    addItem: (menuItemId: number, quantity = 1) =>
      runMutation(() => ordersApi.addOrderItem(orderId, { menuItemId, quantity })),
    setItemQuantity: (itemId: number, quantity: number) =>
      runMutation(() => ordersApi.updateOrderItem(orderId, itemId, quantity)),
    removeItem: (itemId: number) => runMutation(() => ordersApi.removeOrderItem(orderId, itemId)),
    setItemReady: (itemId: number, ready: boolean) =>
      runMutation(() => ordersApi.setOrderItemReady(orderId, itemId, ready)),
    setItemServed: (itemId: number, served: boolean, staffId: number) =>
      runMutation(() => ordersApi.setOrderItemServed(orderId, itemId, served, staffId)),
    setItemTakeout: (itemId: number, isTakeout: boolean) =>
      runMutation(() => ordersApi.setOrderItemTakeout(orderId, itemId, isTakeout)),
    addCombo: (comboId: number, selections: { slotId: number; menuItemId: number }[]) =>
      runMutation(() => ordersApi.addOrderCombo(orderId, { comboId, selections })),
    removeCombo: (comboInstanceId: number) => runMutation(() => ordersApi.removeOrderCombo(orderId, comboInstanceId)),
    setComboTakeout: (comboInstanceId: number, isTakeout: boolean) =>
      runMutation(() => ordersApi.setOrderComboTakeout(orderId, comboInstanceId, isTakeout)),
    submit: (staffId: number) => runMutation(() => ordersApi.submitOrder(orderId, staffId)),
    serveReadyItems: (staffId: number) => runMutation(() => ordersApi.serveReadyItems(orderId, staffId)),
    reopen: (staffId: number) => runMutation(() => ordersApi.reopenOrder(orderId, staffId)),
    requestPayment: (staffId: number) => runMutation(() => ordersApi.requestPayment(orderId, staffId)),
    completePayment: (staffId: number) => runMutation(() => ordersApi.completePayment(orderId, staffId)),
  };
}
