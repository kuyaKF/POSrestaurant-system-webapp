import { MenuItem } from "../../types";
import { formatCurrency } from "../../lib/format";
import { contrastTextColor } from "../../lib/color";

export function MenuItemCard({
  menuItem,
  onClick,
  disabled,
}: {
  menuItem: MenuItem;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="item-card menu-item-card" onClick={onClick} disabled={disabled}>
      <div className="menu-item-card-top">
        <span
          className="item-card-price-badge"
          style={{
            backgroundColor: menuItem.category.color,
            color: contrastTextColor(menuItem.category.color),
          }}
        >
          {formatCurrency(menuItem.price)}
        </span>
      </div>
      <div className="item-card-body">
        <div className="item-card-name">{menuItem.name}</div>
        <div className="item-card-meta">{menuItem.category.name}</div>
      </div>
    </button>
  );
}
