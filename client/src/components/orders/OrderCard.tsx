import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Order } from "../../types";
import { formatCurrency, formatElapsed } from "../../lib/format";
import { CancelOrderModal } from "./CancelOrderModal";

const HOLD_TO_CANCEL_MS = 2000;

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
  onCancel,
}: {
  order: Order;
  onMarkServed?: (orderId: number) => void;
  onCancel?: (orderId: number) => Promise<unknown> | void;
}) {
  const navigate = useNavigate();
  const [, forceTick] = useState(0);
  const [holding, setHolding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);

  const startHold = () => {
    if (cancelling) return;
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      setHolding(false);
      setConfirming(true);
    }, HOLD_TO_CANCEL_MS);
  };

  const releaseHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHolding(false);
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await onCancel?.(order.id);
      setConfirming(false);
    } catch {
      // Surfaced via the board's error banner — keep the modal open so the
      // user can retry or back out explicitly.
    } finally {
      setCancelling(false);
    }
  };

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
      {order.status === "SEATED" && onCancel && (
        <button
          type="button"
          className={`hold-cancel-btn ${holding ? "holding" : ""}`}
          onPointerDown={startHold}
          onPointerUp={releaseHold}
          onPointerLeave={releaseHold}
          onPointerCancel={releaseHold}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Press and hold for 2 seconds to cancel this order"
        >
          <span className="hold-cancel-fill" />
          <span className="hold-cancel-label">Hold to Cancel</span>
        </button>
      )}
      {confirming && (
        <CancelOrderModal
          order={order}
          submitting={cancelling}
          onClose={() => !cancelling && setConfirming(false)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}
