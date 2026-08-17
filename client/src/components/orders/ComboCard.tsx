import { Combo } from "../../types";

export function ComboCard({ combo, onClick, disabled }: { combo: Combo; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="item-card combo-card" onClick={onClick} disabled={disabled}>
      <div className="menu-item-card-top">
        <span className="item-card-price-badge combo-card-badge">
          {combo.discountPercent > 0 ? `${combo.discountPercent}% OFF` : "COMBO"}
        </span>
      </div>
      <div className="item-card-body">
        <div className="item-card-name">{combo.name}</div>
        <div className="item-card-meta">{combo.slots.map((slot) => slot.category.name).join(" + ")}</div>
      </div>
    </button>
  );
}
