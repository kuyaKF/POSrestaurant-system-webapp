import { useState } from "react";
import { Combo, MenuItem } from "../../types";
import { formatCurrency } from "../../lib/format";
import { applyComboDiscount } from "../../lib/comboPricing";
import { Modal } from "../common/Modal";
import { EmptyState } from "../common/EmptyState";

export function ComboSelectionModal({
  combo,
  menuItems,
  onConfirm,
  onClose,
}: {
  combo: Combo;
  menuItems: MenuItem[];
  onConfirm: (selections: { slotId: number; menuItemId: number }[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Record<number, number>>({});

  const allSlotsFilled = combo.slots.every((slot) => selected[slot.id] !== undefined);
  const menuItemById = new Map(menuItems.map((mi) => [mi.id, mi]));
  const selectedSubtotal = Object.values(selected).reduce(
    (sum, menuItemId) => sum + (menuItemById.get(menuItemId)?.price ?? 0),
    0
  );
  const selectedPrice = applyComboDiscount(selectedSubtotal, combo.discountPercent);

  return (
    <Modal title={`Add ${combo.name}`} onClose={onClose}>
      {combo.slots.map((slot) => {
        const options = menuItems.filter((mi) => mi.categoryId === slot.categoryId);
        return (
          <div className="form-row" key={slot.id}>
            <label>{slot.category.name}</label>
            {options.length === 0 ? (
              <EmptyState message={`No available ${slot.category.name} items.`} />
            ) : (
              <div className="combo-slot-options">
                {options.map((mi) => (
                  <button
                    key={mi.id}
                    type="button"
                    className={`category-chip ${selected[slot.id] === mi.id ? "active" : ""}`}
                    onClick={() => setSelected((prev) => ({ ...prev, [slot.id]: mi.id }))}
                  >
                    {mi.name} ({formatCurrency(mi.price)})
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {allSlotsFilled && (
        <div className="combo-selection-preview">
          <span>Combo Price</span>
          <span>
            {combo.discountPercent > 0 && (
              <span className="combo-selection-preview-subtotal">{formatCurrency(selectedSubtotal)}</span>
            )}
            {formatCurrency(selectedPrice)}
          </span>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!allSlotsFilled}
          onClick={() =>
            onConfirm(combo.slots.map((slot) => ({ slotId: slot.id, menuItemId: selected[slot.id] })))
          }
        >
          {allSlotsFilled ? `Add Combo — ${formatCurrency(selectedPrice)}` : "Add Combo"}
        </button>
      </div>
    </Modal>
  );
}
