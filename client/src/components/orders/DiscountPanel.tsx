import { useState } from "react";
import { DiscountType, Order } from "../../types";

const DISCOUNT_LABEL: Record<DiscountType, string> = {
  SENIOR: "Senior Citizen",
  PWD: "PWD",
};

export function DiscountPanel({
  order,
  editable,
  disabled,
  onSetDiscount,
}: {
  order: Order;
  editable: boolean;
  disabled?: boolean;
  onSetDiscount: (input: {
    discountType: DiscountType | null;
    idNumber?: string | null;
    name?: string | null;
  }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("SENIOR");
  const [idNumber, setIdNumber] = useState("");
  const [name, setName] = useState("");

  if (order.discountType && !editing) {
    return (
      <div className="discount-panel discount-panel--applied">
        <div>
          <div className="discount-panel-label">{DISCOUNT_LABEL[order.discountType]} Discount</div>
          <div className="discount-panel-meta">
            ID {order.discountIdNumber} · {order.discountName}
          </div>
        </div>
        {editable && (
          <button
            type="button"
            className="btn btn-sm btn-danger"
            disabled={disabled}
            onClick={() => onSetDiscount({ discountType: null })}
          >
            Remove
          </button>
        )}
      </div>
    );
  }

  if (!editable) return null;

  if (!editing) {
    return (
      <button type="button" className="discount-panel-toggle" onClick={() => setEditing(true)}>
        + Apply Senior/PWD Discount
      </button>
    );
  }

  const canApply = idNumber.trim().length > 0 && name.trim().length > 0;

  return (
    <div className="discount-panel discount-panel--editing">
      <div className="discount-type-toggle">
        <label className="discount-type-option">
          <input
            type="radio"
            name="discount-type"
            checked={discountType === "SENIOR"}
            onChange={() => setDiscountType("SENIOR")}
          />
          Senior Citizen
        </label>
        <label className="discount-type-option">
          <input
            type="radio"
            name="discount-type"
            checked={discountType === "PWD"}
            onChange={() => setDiscountType("PWD")}
          />
          PWD
        </label>
      </div>
      <div className="form-row">
        <label>ID Number</label>
        <input className="input" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} autoFocus />
      </div>
      <div className="form-row">
        <label>Name on ID</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => setEditing(false)}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canApply || disabled}
          onClick={() => {
            onSetDiscount({ discountType, idNumber: idNumber.trim(), name: name.trim() });
            setEditing(false);
          }}
        >
          Apply Discount
        </button>
      </div>
    </div>
  );
}
