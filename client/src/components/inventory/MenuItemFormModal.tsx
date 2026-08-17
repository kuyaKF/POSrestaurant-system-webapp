import { useState } from "react";
import { Category, MenuItem } from "../../types";
import { MenuItemInput } from "../../api/menu";
import { Modal } from "../common/Modal";

export function MenuItemFormModal({
  item,
  categories,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSave: (input: MenuItemInput) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item ? String(item.price / 100) : "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? 0);

  const priceNumber = Number(price);
  const canSave = name.trim().length > 0 && price !== "" && priceNumber >= 0 && categoryId > 0;

  return (
    <Modal title={item ? "Edit Menu Item" : "Add Menu Item"} onClose={onClose}>
      <div className="form-row">
        <label>Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="form-row">
        <label>Price (₱)</label>
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label>Category</label>
        <select className="select" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
            onSave({ name: name.trim(), price: Math.round(priceNumber * 100), categoryId })
          }
        >
          {item ? "Save Changes" : "Add Item"}
        </button>
      </div>
    </Modal>
  );
}
