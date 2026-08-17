import { OrderCombo, OrderItem } from "../../types";
import { formatCurrency } from "../../lib/format";
import { OrderItemsList } from "./OrderItemsList";
import { IconTrash } from "./icons";

export function ComboPanel({
  combo,
  items,
  readyEditable,
  servedEditable,
  takeoutEditable,
  removable,
  onRemove,
  onToggleReady,
  onToggleServed,
  onToggleTakeout,
}: {
  combo: OrderCombo;
  items: OrderItem[];
  readyEditable?: boolean;
  servedEditable?: boolean;
  takeoutEditable?: boolean;
  removable?: boolean;
  onRemove?: (comboInstanceId: number) => void;
  onToggleReady?: (itemId: number, ready: boolean) => void;
  onToggleServed?: (itemId: number, served: boolean) => void;
  onToggleTakeout?: (comboInstanceId: number, isTakeout: boolean) => void;
}) {
  return (
    <div className="combo-panel">
      <div className="combo-panel-header">
        <span className="combo-panel-name">{combo.nameSnap}</span>
        {takeoutEditable ? (
          <button
            type="button"
            className={`takeout-badge ${combo.isTakeout ? "active" : ""}`}
            onClick={() => onToggleTakeout?.(combo.id, !combo.isTakeout)}
            aria-pressed={combo.isTakeout}
            aria-label={`Mark ${combo.nameSnap} as takeout`}
          >
            Takeout
          </button>
        ) : (
          combo.isTakeout && <span className="takeout-badge active">Takeout</span>
        )}
        <span className="combo-panel-price">{formatCurrency(combo.priceSnap)}</span>
        {removable && (
          <button
            type="button"
            className="icon-btn icon-btn-danger"
            onClick={() => onRemove?.(combo.id)}
            aria-label={`Remove ${combo.nameSnap}`}
          >
            <IconTrash className="icon-btn-svg" />
          </button>
        )}
      </div>
      <OrderItemsList
        items={items}
        hidePricing
        readyEditable={readyEditable}
        servedEditable={servedEditable}
        onToggleReady={onToggleReady}
        onToggleServed={onToggleServed}
      />
    </div>
  );
}
