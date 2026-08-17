import { useEffect, useState } from "react";
import { MenuItem, Order } from "../types";
import { fetchOrders, setOrderItemReady } from "../api/orders";
import { fetchMenuItems } from "../api/menu";
import { ApiError } from "../api/client";
import { useCurrentStaff } from "../context/CurrentStaffContext";
import { useOrderEvents } from "../hooks/useOrderEvents";
import { buildMenuItemCategoryMap, sortItemsByCategory } from "../lib/categorySort";
import { formatElapsed } from "../lib/format";
import { Loading } from "../components/common/Loading";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { EmptyState } from "../components/common/EmptyState";
import { OrderItemsList } from "../components/orders/OrderItemsList";
import { ComboPanel } from "../components/orders/ComboPanel";

export function KitchenViewPage() {
  const { currentStaff } = useCurrentStaff();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingOrderId, setMutatingOrderId] = useState<number | null>(null);

  const load = (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    fetchOrders("PREPARING")
      .then(setOrders)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load orders"))
      .finally(() => {
        if (!opts?.silent) setLoading(false);
      });
  };

  useEffect(() => {
    fetchMenuItems().then(setMenuItems);
    load();
    // Fallback in case the real-time connection drops; the event stream
    // below is what normally keeps this in sync.
    const interval = setInterval(() => load({ silent: true }), 30000);
    return () => clearInterval(interval);
  }, []);

  // Background refreshes (our own actions echoing back, or another
  // device's changes) update quietly — no full-page loading flash.
  useOrderEvents(() => load({ silent: true }));

  const menuItemCategoryById = buildMenuItemCategoryMap(menuItems);

  async function handleToggleReady(orderId: number, itemId: number, ready: boolean) {
    setMutatingOrderId(orderId);
    setError(null);
    try {
      const updated = await setOrderItemReady(orderId, itemId, ready);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update item");
    } finally {
      setMutatingOrderId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Kitchen</h1>
        <button type="button" className="btn" onClick={() => load()}>
          Refresh
        </button>
      </div>

      {!currentStaff && (
        <ErrorBanner message="Select a kitchen crew member from the header before flagging items ready." />
      )}
      {error && <ErrorBanner message={error} />}

      {loading && orders.length === 0 ? (
        <Loading />
      ) : orders.length === 0 ? (
        <EmptyState message="No orders in preparation." />
      ) : (
        <div className="kitchen-grid">
          {orders.map((order) => {
            const readyCount = order.items.filter((item) => item.ready).length;
            const isMutating = mutatingOrderId === order.id;
            const standaloneItems = order.items.filter((item) => item.orderComboId === null);
            const comboItemsFor = (comboInstanceId: number) =>
              order.items.filter((item) => item.orderComboId === comboInstanceId);

            return (
              <div className="card kitchen-order-card" key={order.id} style={{ padding: 16 }}>
                <div className="kitchen-order-header">
                  <h2 className="kitchen-order-title">
                    {order.orderType === "TAKEOUT" ? "Takeout" : `Table ${order.table?.number}`}
                    {order.currentRound > 1 && (
                      <span className="order-card-round-badge">Round {order.currentRound}</span>
                    )}
                  </h2>
                  <span className="order-card-elapsed">{formatElapsed(order.statusChangedAt)}</span>
                </div>

                <p className="order-items-progress">
                  {readyCount} of {order.items.length} items ready
                </p>

                <OrderItemsList
                  items={sortItemsByCategory(standaloneItems, menuItemCategoryById)}
                  readyEditable={!!currentStaff && !isMutating}
                  onToggleReady={(itemId, ready) => handleToggleReady(order.id, itemId, ready)}
                />
                {order.combos.map((combo) => (
                  <ComboPanel
                    key={combo.id}
                    combo={combo}
                    items={comboItemsFor(combo.id)}
                    readyEditable={!!currentStaff && !isMutating}
                    onToggleReady={(itemId, ready) => handleToggleReady(order.id, itemId, ready)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
