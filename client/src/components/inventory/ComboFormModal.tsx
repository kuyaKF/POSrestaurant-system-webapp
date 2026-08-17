import { useState } from "react";
import { Category, Combo } from "../../types";
import { ComboInput } from "../../api/combos";
import { Modal } from "../common/Modal";
import { IconTrash } from "../orders/icons";

export function ComboFormModal({
  combo,
  categories,
  onClose,
  onSave,
}: {
  combo: Combo | null;
  categories: Category[];
  onClose: () => void;
  onSave: (input: ComboInput) => void;
}) {
  const [name, setName] = useState(combo?.name ?? "");
  const [discountPercent, setDiscountPercent] = useState(combo ? String(combo.discountPercent) : "0");
  const [slotCategoryIds, setSlotCategoryIds] = useState<number[]>(
    combo && combo.slots.length > 0 ? combo.slots.map((s) => s.categoryId) : [categories[0]?.id ?? 0]
  );

  const discountNumber = Number(discountPercent);
  const canSave =
    name.trim().length > 0 &&
    discountPercent !== "" &&
    discountNumber >= 0 &&
    discountNumber <= 100 &&
    slotCategoryIds.length > 0 &&
    slotCategoryIds.every((id) => id > 0);

  function addSlot() {
    setSlotCategoryIds((prev) => [...prev, categories[0]?.id ?? 0]);
  }
  function removeSlot(index: number) {
    setSlotCategoryIds((prev) => prev.filter((_, i) => i !== index));
  }
  function updateSlot(index: number, categoryId: number) {
    setSlotCategoryIds((prev) => prev.map((id, i) => (i === index ? categoryId : id)));
  }

  return (
    <Modal title={combo ? "Edit Combo" : "Add Combo"} onClose={onClose}>
      <div className="form-row">
        <label>Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="form-row">
        <label>Slots (one item picked from each, at order time)</label>
        {slotCategoryIds.map((catId, i) => (
          <div className="combo-slot-editor-row" key={i}>
            <select className="select" value={catId} onChange={(e) => updateSlot(i, Number(e.target.value))}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="icon-btn icon-btn-danger"
              onClick={() => removeSlot(i)}
              disabled={slotCategoryIds.length <= 1}
              aria-label="Remove slot"
            >
              <IconTrash className="icon-btn-svg" />
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={addSlot}>
          Add Slot
        </button>
      </div>
      <div className="form-row">
        <label>Discount (%)</label>
        <input
          className="input"
          type="number"
          min="0"
          max="100"
          step="1"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
        />
        <p className="combo-discount-hint">
          Applied to the sum of whichever items are picked for each slot at order time — the combo
          has no single fixed price.
        </p>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canSave}
          onClick={() =>
            onSave({
              name: name.trim(),
              discountPercent: discountNumber,
              slots: slotCategoryIds.map((categoryId) => ({ categoryId })),
            })
          }
        >
          {combo ? "Save Changes" : "Add Combo"}
        </button>
      </div>
    </Modal>
  );
}
