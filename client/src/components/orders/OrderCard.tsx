import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Order } from "../../types";
import { formatCurrency, formatElapsed } from "../../lib/format";

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function OrderCard({
  order,
  onMarkServed,
}: {
  order: Order;
  onMarkServed?: (orderId: number) => void;
}) {
  const navigate = useNavigate();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const servedLineCount = order.items.filter((item) => item.served).length;
  const readyUnservedCount = order.items.filter((item) => item.ready && !item.served).length;
  const showReadyBanner = order.status === "PREPARING" && readyUnservedCount > 0;

  return (
    <div className={`order-card ${showReadyBanner ? "order-card--ready" : ""}`}>
      {showReadyBanner && (
        <div className="order-card-ready-notice">
          <IconCheck className="order-card-ready-icon" />
          {readyUnservedCount} order{readyUnservedCount === 1 ? "" : "s"} ready
        </div>
      )}
      <button type="button" className="order-card-body" onClick={() => navigate(`/orders/${order.id}`)}>
        <div className="order-card-top">
          <span className="order-card-table">
            {order.orderType === "TAKEOUT" ? (
              <span className="order-card-takeout-badge">Takeout</span>
            ) : (
              `Table ${order.table?.number}`
            )}
            {order.currentRound > 1 && <span className="order-card-round-badge">Round {order.currentRound}</span>}
          </span>
          <span className="order-card-elapsed">{formatElapsed(order.statusChangedAt)}</span>
        </div>
        <div className="order-card-meta">
          {order.orderType === "TAKEOUT"
            ? order.server.name
            : `${order.partySize} guest${order.partySize === 1 ? "" : "s"} · ${order.server.name}`}
        </div>
        {order.status === "PREPARING" && order.items.length > 0 && (
          <div className="order-card-progress">
            <div className="order-card-progress-track">
              <div
                className="order-card-progress-fill"
                style={{ transform: `scaleX(${servedLineCount / order.items.length})` }}
              />
            </div>
            <span className="order-card-progress-label">
              {servedLineCount}/{order.items.length} served
            </span>
          </div>
        )}
        <div className="order-card-bottom">
          <span>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
          <span className="order-card-total">{formatCurrency(order.total)}</span>
        </div>
      </button>
      {showReadyBanner && (
        <button
          type="button"
          className="btn btn-primary order-card-serve-btn"
          onClick={() => onMarkServed?.(order.id)}
        >
          Serve Now
        </button>
      )}
    </div>
  );
}
