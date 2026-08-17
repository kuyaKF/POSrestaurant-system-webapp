import { useEffect, useState } from "react";
import { Category, Combo, MenuItem } from "../types";
import { fetchCategories, fetchMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, MenuItemInput } from "../api/menu";
import { fetchCombos, createCombo, updateCombo, deleteCombo, ComboInput } from "../api/combos";
import { ApiError } from "../api/client";
import { formatCurrency } from "../lib/format";
import { Loading } from "../components/common/Loading";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { EmptyState } from "../components/common/EmptyState";
import { MenuItemFormModal } from "../components/inventory/MenuItemFormModal";
import { ComboFormModal } from "../components/inventory/ComboFormModal";

type Tab = "items" | "combos";

export function InventoryDashboardPage() {
  const [tab, setTab] = useState<Tab>("items");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [showComboModal, setShowComboModal] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchMenuItems({ activeOnly: false }),
      fetchCategories(),
      fetchCombos({ activeOnly: false }),
    ])
      .then(([items, cats, comboList]) => {
        setMenuItems(items);
        setCategories(cats);
        setCombos(comboList);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load menu data"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function handleSaveItem(input: MenuItemInput) {
    setError(null);
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, input);
      } else {
        await createMenuItem(input);
      }
      setShowItemModal(false);
      setEditingItem(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save menu item");
    }
  }

  async function handleToggleItemActive(item: MenuItem) {
    setError(null);
    try {
      await updateMenuItem(item.id, { isActive: !item.isActive });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update menu item");
    }
  }

  async function handleDeleteItem(item: MenuItem) {
    setError(null);
    try {
      await deleteMenuItem(item.id);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete menu item — try deactivating it instead");
    }
  }

  async function handleSaveCombo(input: ComboInput) {
    setError(null);
    try {
      if (editingCombo) {
        await updateCombo(editingCombo.id, input);
      } else {
        await createCombo(input);
      }
      setShowComboModal(false);
      setEditingCombo(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save combo");
    }
  }

  async function handleToggleComboActive(combo: Combo) {
    setError(null);
    try {
      await updateCombo(combo.id, { isActive: !combo.isActive });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update combo");
    }
  }

  async function handleDeleteCombo(combo: Combo) {
    setError(null);
    try {
      await deleteCombo(combo.id);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete combo — try deactivating it instead");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        {tab === "items" ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingItem(null);
              setShowItemModal(true);
            }}
          >
            Add Item
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingCombo(null);
              setShowComboModal(true);
            }}
          >
            Add Combo
          </button>
        )}
      </div>

      <div className="order-type-toggle">
        <button
          type="button"
          className={`order-type-toggle-btn ${tab === "items" ? "active" : ""}`}
          onClick={() => setTab("items")}
        >
          Menu Items
        </button>
        <button
          type="button"
          className={`order-type-toggle-btn ${tab === "combos" ? "active" : ""}`}
          onClick={() => setTab("combos")}
        >
          Combos
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <Loading />
      ) : tab === "items" ? (
        menuItems.length === 0 ? (
          <EmptyState message="No menu items yet." />
        ) : (
          <div className="record-grid">
            {menuItems.map((item) => (
              <div className="record-card" key={item.id}>
                <div className="record-card-header">
                  <div>
                    <div className="record-card-title">{item.name}</div>
                    <div className="record-card-subtitle">{item.category.name}</div>
                  </div>
                  <span
                    className={`badge record-card-badge ${item.isActive ? "badge-available" : "badge-occupied"}`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="record-card-price">{formatCurrency(item.price)}</div>
                <div className="record-card-actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setEditingItem(item);
                      setShowItemModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => handleToggleItemActive(item)}>
                    {item.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteItem(item)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : combos.length === 0 ? (
        <EmptyState message="No combos yet." />
      ) : (
        <div className="record-grid">
          {combos.map((combo) => (
            <div className="record-card" key={combo.id}>
              <div className="record-card-header">
                <div>
                  <div className="record-card-title">{combo.name}</div>
                  <div className="record-card-subtitle">
                    {combo.slots.map((slot) => slot.category.name).join(" + ")}
                  </div>
                </div>
                <span
                  className={`badge record-card-badge ${combo.isActive ? "badge-available" : "badge-occupied"}`}
                >
                  {combo.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="record-card-price record-card-price-muted">
                {combo.discountPercent}% off selected items
              </div>
              <div className="record-card-actions">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setEditingCombo(combo);
                    setShowComboModal(true);
                  }}
                >
                  Edit
                </button>
                <button type="button" className="btn btn-sm" onClick={() => handleToggleComboActive(combo)}>
                  {combo.isActive ? "Deactivate" : "Activate"}
                </button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteCombo(combo)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showItemModal && (
        <MenuItemFormModal
          item={editingItem}
          categories={categories}
          onClose={() => setShowItemModal(false)}
          onSave={handleSaveItem}
        />
      )}

      {showComboModal && (
        <ComboFormModal
          combo={editingCombo}
          categories={categories}
          onClose={() => setShowComboModal(false)}
          onSave={handleSaveCombo}
        />
      )}
    </div>
  );
}
