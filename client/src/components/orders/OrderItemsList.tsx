import { useState } from "react";
import { OrderItem } from "../../types";
import { formatCurrency } from "../../lib/format";
import { IconTrash } from "./icons";

export function OrderItemsList({
  items,
  editable,
  readyEditable,
  servedEditable,
  takeoutEditable,
  hidePricing,
  onSetQuantity,
  onRemove,
  onToggleReady,
  onToggleServed,
  onToggleTakeout,
  onSetNotes,
}: {
  items: OrderItem[];
  editable?: boolean;
  readyEditable?: boolean;
  servedEditable?: boolean;
  takeoutEditable?: boolean;
  hidePricing?: boolean;
  onSetQuantity?: (itemId: number, quantity: number) => void;
  onRemove?: (itemId: number) => void;
  onToggleReady?: (itemId: number, ready: boolean) => void;
  onToggleServed?: (itemId: number, served: boolean) => void;
  onToggleTakeout?: (itemId: number, isTakeout: boolean) => void;
  onSetNotes?: (itemId: number, notes: string | null) => void;
}) {
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  if (items.length === 0) {
    return <p className="order-items-empty">No items added yet.</p>;
  }

  return (
    <div className="order-items-list">
      {items.map((item) => {
        const locked = item.ready || item.served;
        const canEditItem = editable && !locked;
        const canToggleTakeout = takeoutEditable && canEditItem;
        const canEditNotes = canEditItem && !!onSetNotes;
        const showItemStatus = readyEditable || servedEditable || locked;
        const isEditingNotes = editingNoteId === item.id;

        return (
          <div
            className={`cart-line ${item.served ? "cart-line--served" : ""}`}
            key={item.id}
          >
            <div className="cart-line-header">
              <span className="cart-line-name">{item.nameSnap}</span>
              {canToggleTakeout ? (
                <button
                  type="button"
                  className={`takeout-badge ${item.isTakeout ? "active" : ""}`}
                  onClick={() => onToggleTakeout?.(item.id, !item.isTakeout)}
                  aria-pressed={item.isTakeout}
                  aria-label={`Mark ${item.nameSnap} as takeout`}
                >
                  Takeout
                </button>
              ) : (
                item.isTakeout && <span className="takeout-badge active">Takeout</span>
              )}
            </div>

            {(item.notes || canEditNotes) && (
              <div className="cart-line-note-row">
                {isEditingNotes ? (
                  <textarea
                    className="textarea cart-line-note-input"
                    defaultValue={item.notes ?? ""}
                    placeholder="e.g. no ice"
                    autoFocus
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value !== (item.notes ?? "")) {
                        onSetNotes?.(item.id, value || null);
                      }
                      setEditingNoteId(null);
                    }}
                  />
                ) : item.notes ? (
                  <button
                    type="button"
                    className={`cart-line-note ${canEditNotes ? "cart-line-note--editable" : ""}`}
                    disabled={!canEditNotes}
                    onClick={() => canEditNotes && setEditingNoteId(item.id)}
                  >
                    📝 {item.notes}
                  </button>
                ) : (
                  <button type="button" className="cart-line-note-toggle" onClick={() => setEditingNoteId(item.id)}>
                    + Add note
                  </button>
                )}
              </div>
            )}

            <div className="cart-line-footer">
              {!hidePricing && (
                <span className="cart-line-price">{formatCurrency(item.unitPriceSnap)} each</span>
              )}

              {canEditItem ? (
                <div className="cart-line-actions">
                  <div className="qty-stepper">
                    <button
                      type="button"
                      className="qty-stepper-btn"
                      onClick={() => onSetQuantity?.(item.id, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.nameSnap}`}
                    >
                      −
                    </button>
                    <span className="qty-stepper-value">{item.quantity}</span>
                    <button
                      type="button"
                      className="qty-stepper-btn"
                      onClick={() => onSetQuantity?.(item.id, item.quantity + 1)}
                      aria-label={`Increase quantity of ${item.nameSnap}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="icon-btn icon-btn-danger"
                    onClick={() => onRemove?.(item.id)}
                    aria-label={`Remove ${item.nameSnap}`}
                  >
                    <IconTrash className="icon-btn-svg" />
                  </button>
                </div>
              ) : showItemStatus ? (
                <div className="item-status-controls">
                  <label className="item-status-checkbox">
                    <input
                      type="checkbox"
                      checked={item.ready}
                      disabled={!readyEditable}
                      onChange={(e) => onToggleReady?.(item.id, e.target.checked)}
                      aria-label={`Mark ${item.nameSnap} as ready`}
                    />
                    Ready
                  </label>
                  <label className="item-status-checkbox">
                    <input
                      type="checkbox"
                      checked={item.served}
                      disabled={!servedEditable || !item.ready}
                      onChange={(e) => onToggleServed?.(item.id, e.target.checked)}
                      aria-label={`Mark ${item.nameSnap} as served`}
                    />
                    Served
                  </label>
                </div>
              ) : (
                <span className="cart-line-qty">× {item.quantity}</span>
              )}

              {!hidePricing && <span className="cart-line-total">{formatCurrency(item.lineTotal)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
