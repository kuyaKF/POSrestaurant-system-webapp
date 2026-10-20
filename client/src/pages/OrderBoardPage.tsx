import { useEffect, useState } from "react";
import { Order, OrderStatus } from "../types";
import { cancelOrder, fetchOrders, serveReadyItems } from "../api/orders";
import { ApiError } from "../api/client";
import { ORDER_STATUSES } from "../lib/color";
import { useCurrentStaff } from "../context/CurrentStaffContext";
import { useOrderEvents } from "../hooks/useOrderEvents";
import { Loading } from "../components/common/Loading";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { OrderColumn } from "../components/orders/OrderColumn";

// In-flight statuses are naturally bounded by how many tables/takeout
// orders are actually being worked right now, so they're fetched in full.
// Payment Fulfilled is a terminal state that only ever grows — fetching
// "today's completions" instead of all-time history keeps that column (and
// the request itself) from growing forever. See server listOrders() for the
// hard row-count backstop that applies regardless.
const ACTIVE_STATUSES: OrderStatus[] = ["SEATED", "PREPARING", "SERVED", "PAYMENT_PENDING"];

function startOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

export function OrderBoardPage() {
  const { currentStaff } = useCurrentStaff();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    Promise.all([
      fetchOrders({ status: ACTIVE_STATUSES }),
      fetchOrders({ status: "PAYMENT_FULFILLED", since: startOfToday() }),
    ])
      .then(([active, recentlyFulfilled]) => setOrders([...active, ...recentlyFulfilled]))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load orders"))
      .finally(() => {
        if (!opts?.silent) setLoading(false);
      });
  };

  useEffect(() => {
    load();
    // Fallback in case the real-time connection drops; the event stream
    // below is what normally keeps this in sync.
    const interval = setInterval(() => load({ silent: true }), 30000);
    return () => clearInterval(interval);
  }, []);

  // Background refreshes (our own actions echoing back, or another
  // device's changes) update quietly — no full-page loading flash.
  useOrderEvents(() => load({ silent: true }));

  const handleMarkServed = async (orderId: number) => {
    if (!currentStaff) {
      setError("Select a server from the header before marking an order served.");
      return;
    }
    setError(null);
    try {
      await serveReadyItems(orderId, currentStaff.id);
      load({ silent: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to mark order served");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!currentStaff) {
      setError("Select a server from the header before cancelling an order.");
      throw new Error("no staff selected");
    }
    setError(null);
    try {
      await cancelOrder(orderId, currentStaff.id);
      load({ silent: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to cancel order");
      throw e;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Order Pipeline</h1>
        <button type="button" className="btn" onClick={() => load()}>
          Refresh
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading && orders.length === 0 ? (
        <Loading />
      ) : (
        <div className="kanban-board">
          {ORDER_STATUSES.map((status) => (
            <OrderColumn
              key={status}
              status={status}
              orders={orders.filter((o) => o.status === status)}
              onMarkServed={handleMarkServed}
              onCancel={handleCancelOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
