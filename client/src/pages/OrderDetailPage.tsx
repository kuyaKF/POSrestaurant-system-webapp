import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Combo, MenuItem, OrderItem } from "../types";
import { fetchMenuItems, fetchCategories } from "../api/menu";
import { fetchCombos } from "../api/combos";
import { useCurrentStaff } from "../context/CurrentStaffContext";
import { useOrder } from "../hooks/useOrder";
import { formatCurrency } from "../lib/format";
import { contrastTextColor } from "../lib/color";
import { Loading } from "../components/common/Loading";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { EmptyState } from "../components/common/EmptyState";
import { StatusBadge } from "../components/orders/StatusBadge";
import { MenuItemCard } from "../components/orders/MenuItemCard";
import { ComboCard } from "../components/orders/ComboCard";
import { ComboSelectionModal } from "../components/orders/ComboSelectionModal";
import { ComboPanel } from "../components/orders/ComboPanel";
import { OrderItemsList } from "../components/orders/OrderItemsList";
import { CategorySummary, CategoryCount } from "../components/orders/CategorySummary";
import { DiscountPanel } from "../components/orders/DiscountPanel";
import { VatBreakdown } from "../components/orders/VatBreakdown";
import { StatusHistory } from "../components/orders/StatusHistory";
import { buildMenuItemCategoryMap, sortItemsByCategory } from "../lib/categorySort";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();
  const { currentStaff } = useCurrentStaff();
  const {
    order,
    loading,
    error,
    mutating,
    addItem,
    setItemQuantity,
    removeItem,
    setItemServed,
    setItemTakeout,
    setItemNotes,
    addCombo,
    removeCombo,
    setComboTakeout,
    setDiscount,
    submit,
    reopen,
    requestPayment,
    completePayment,
  } = useOrder(orderId);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; color: string }[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [comboModalCombo, setComboModalCombo] = useState<Combo | null>(null);

  useEffect(() => {
    Promise.all([fetchMenuItems(), fetchCategories(), fetchCombos()]).then(([items, cats, comboList]) => {
      setMenuItems(items);
      setCategories(cats);
      setCombos(comboList);
    });
  }, []);

  const filteredMenuItems = useMemo(
    () => menuItems.filter((mi) => !selectedCategoryId || mi.categoryId === selectedCategoryId),
    [menuItems, selectedCategoryId]
  );

  if (loading) return <Loading />;
  if (error && !order) return <ErrorBanner message={error} />;
  if (!order) return <EmptyState message="Order not found." />;

  const staffId = currentStaff?.id;
  const servedCount = order.items.filter((item) => item.served).length;
  const canAddItems = order.status === "SEATED" || order.status === "PREPARING";
  const isFollowUpRound = order.status === "PREPARING" && order.currentRound > 1;
  const canEditDiscount = !!staffId && order.status !== "PAYMENT_FULFILLED" && order.status !== "CANCELLED";

  // Combo component items render inside their own ComboPanel rather than the
  // flat item list, so split them out here.
  const standaloneItems = order.items.filter((item) => item.orderComboId === null);
  const previousRoundItems = standaloneItems.filter((item) => item.round < order.currentRound);
  const currentRoundItems = standaloneItems.filter((item) => item.round === order.currentRound);
  const previousRoundCombos = order.combos.filter((combo) => combo.round < order.currentRound);
  const currentRoundCombos = order.combos.filter((combo) => combo.round === order.currentRound);
  const comboItemsFor = (comboInstanceId: number) =>
    order.items.filter((item) => item.orderComboId === comboInstanceId);
  const isComboLocked = (comboInstanceId: number) =>
    comboItemsFor(comboInstanceId).some((item) => item.ready || item.served);

  const totalItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const previousRoundItemCount = order.items
    .filter((item) => item.round < order.currentRound)
    .reduce((sum, item) => sum + item.quantity, 0);
  const previousRoundSubtotal =
    previousRoundItems.reduce((sum, item) => sum + item.lineTotal, 0) +
    previousRoundCombos.reduce((sum, combo) => sum + combo.priceSnap, 0);

  const menuItemCategoryById = buildMenuItemCategoryMap(menuItems);
  function categoryBreakdown(items: OrderItem[]): CategoryCount[] {
    const counts = new Map<string, CategoryCount>();
    for (const item of items) {
      const category = menuItemCategoryById.get(item.menuItemId);
      const name = category?.name ?? "Other";
      const color = category?.color ?? "#64748b";
      const existing = counts.get(name);
      if (existing) {
        existing.count += item.quantity;
      } else {
        counts.set(name, { name, color, count: item.quantity });
      }
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }
  const orderCategoryBreakdown = categoryBreakdown(order.items);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            {order.orderType === "TAKEOUT" ? "Takeout Order" : `Table ${order.table?.number}`}{" "}
            <StatusBadge status={order.status} />
          </h1>
          <p className="order-detail-meta">
            {order.orderType === "TAKEOUT"
              ? `Server: ${order.server.name}`
              : `${order.partySize} guest${order.partySize === 1 ? "" : "s"} · Server: ${order.server.name}`}
          </p>
        </div>
        <button type="button" className="btn" onClick={() => navigate("/")}>
          Back to Board
        </button>
      </div>

      {error && <ErrorBanner message={error} />}
      {!currentStaff && <ErrorBanner message="Select a server from the header to take actions on this order." />}

      {canAddItems && (
        <div className="pos-layout">
          <div>
            <div className="pos-filters">
              <div className="category-chip-row">
                <button
                  className={`category-chip ${selectedCategoryId === null ? "active" : ""}`}
                  onClick={() => setSelectedCategoryId(null)}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`category-chip ${selectedCategoryId === c.id ? "active" : ""}`}
                    style={
                      selectedCategoryId === c.id
                        ? { backgroundColor: c.color, borderColor: c.color, color: contrastTextColor(c.color) }
                        : undefined
                    }
                    onClick={() => setSelectedCategoryId(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {combos.length > 0 && (
              <div className="combo-picker-section">
                <h2 className="combo-picker-heading">Combos</h2>
                <div className="item-grid">
                  {combos.map((combo) => (
                    <ComboCard key={combo.id} combo={combo} onClick={() => setComboModalCombo(combo)} disabled={mutating} />
                  ))}
                </div>
              </div>
            )}

            {filteredMenuItems.length === 0 ? (
              <EmptyState message="No menu items in this category." />
            ) : (
              <div className="item-grid">
                {filteredMenuItems.map((mi) => (
                  <MenuItemCard key={mi.id} menuItem={mi} onClick={() => addItem(mi.id)} disabled={mutating} />
                ))}
              </div>
            )}
          </div>

          <div className={isFollowUpRound ? "order-panels cart-panel" : "cart-panel"}>
            {isFollowUpRound && (previousRoundItems.length > 0 || previousRoundCombos.length > 0) && (
              <div className="card" style={{ padding: 16 }}>
                <h2 style={{ marginTop: 0, fontSize: 16 }}>Original Order</h2>
                <OrderItemsList items={sortItemsByCategory(previousRoundItems, menuItemCategoryById)} />
                {previousRoundCombos.map((combo) => (
                  <ComboPanel key={combo.id} combo={combo} items={comboItemsFor(combo.id)} />
                ))}
                <div className="cart-total-row cart-total-row--sub">
                  <span>
                    Subtotal <span className="cart-total-count">({previousRoundItemCount} item{previousRoundItemCount === 1 ? "" : "s"})</span>
                  </span>
                  <span>{formatCurrency(previousRoundSubtotal)}</span>
                </div>
              </div>
            )}

            <div className="card" style={{ padding: 16 }}>
              <h2 style={{ marginTop: 0, fontSize: 16 }}>
                {isFollowUpRound ? `Additional Order (Round ${order.currentRound})` : "Order Items"}
              </h2>
              {order.status === "PREPARING" && (
                <p className="order-items-progress">
                  {servedCount} of {order.items.length} items served
                </p>
              )}
              <OrderItemsList
                items={sortItemsByCategory(currentRoundItems, menuItemCategoryById)}
                editable
                servedEditable={order.status === "PREPARING" && !!staffId}
                takeoutEditable={order.orderType === "DINE_IN"}
                onSetQuantity={(itemId, quantity) => setItemQuantity(itemId, quantity)}
                onRemove={(itemId) => removeItem(itemId)}
                onToggleServed={(itemId, served) => staffId && setItemServed(itemId, served, staffId)}
                onToggleTakeout={(itemId, isTakeout) => setItemTakeout(itemId, isTakeout)}
                onSetNotes={(itemId, notes) => setItemNotes(itemId, notes)}
              />
              {currentRoundCombos.map((combo) => (
                <ComboPanel
                  key={combo.id}
                  combo={combo}
                  items={comboItemsFor(combo.id)}
                  servedEditable={order.status === "PREPARING" && !!staffId}
                  takeoutEditable={order.orderType === "DINE_IN" && !isComboLocked(combo.id)}
                  removable={!isComboLocked(combo.id)}
                  onRemove={(comboInstanceId) => removeCombo(comboInstanceId)}
                  onToggleServed={(itemId, served) => staffId && setItemServed(itemId, served, staffId)}
                  onToggleTakeout={(comboInstanceId, isTakeout) => setComboTakeout(comboInstanceId, isTakeout)}
                />
              ))}
              <CategorySummary breakdown={orderCategoryBreakdown} />
              <DiscountPanel order={order} editable={canEditDiscount} disabled={mutating} onSetDiscount={setDiscount} />
              <VatBreakdown order={order} />
              <div className="cart-total-row">
                <span>
                  Order Total <span className="cart-total-count">({totalItemCount} item{totalItemCount === 1 ? "" : "s"})</span>
                </span>
                <span>{formatCurrency(order.total)}</span>
              </div>

              {order.status === "SEATED" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: 12 }}
                  disabled={!staffId || order.items.length === 0 || mutating}
                  onClick={() => staffId && submit(staffId)}
                >
                  {mutating ? "Submitting…" : "Submit Order"}
                </button>
              )}

            </div>
          </div>
        </div>
      )}

      {!canAddItems && (
        <div className="card order-summary-panel" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Order Items</h2>
          <OrderItemsList items={sortItemsByCategory(standaloneItems, menuItemCategoryById)} />
          {order.combos.map((combo) => (
            <ComboPanel key={combo.id} combo={combo} items={comboItemsFor(combo.id)} />
          ))}
          <CategorySummary breakdown={orderCategoryBreakdown} />
          <DiscountPanel order={order} editable={canEditDiscount} disabled={mutating} onSetDiscount={setDiscount} />
          <VatBreakdown order={order} />
          <div className="cart-total-row">
            <span>
              Total <span className="cart-total-count">({totalItemCount} item{totalItemCount === 1 ? "" : "s"})</span>
            </span>
            <span>{formatCurrency(order.total)}</span>
          </div>

          {order.status === "SERVED" && (
            <div className="order-summary-actions">
              <button
                type="button"
                className="btn"
                disabled={!staffId || mutating}
                onClick={() => staffId && reopen(staffId)}
              >
                {mutating ? "Updating…" : "Send Additional Order"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!staffId || mutating}
                onClick={() => staffId && requestPayment(staffId)}
              >
                {mutating ? "Updating…" : "Send to Payment"}
              </button>
            </div>
          )}

          {order.status === "PAYMENT_PENDING" && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 12 }}
              disabled={!staffId || mutating}
              onClick={() => staffId && completePayment(staffId)}
            >
              {mutating ? "Updating…" : "Confirm Payment Received"}
            </button>
          )}

          {order.status === "PAYMENT_FULFILLED" && (
            <button
              type="button"
              className="btn"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => navigate("/")}
            >
              Back to Board
            </button>
          )}
        </div>
      )}

      <StatusHistory logs={order.statusLogs} />

      {comboModalCombo && (
        <ComboSelectionModal
          combo={comboModalCombo}
          menuItems={menuItems}
          onClose={() => setComboModalCombo(null)}
          onConfirm={(selections) => {
            addCombo(comboModalCombo.id, selections);
            setComboModalCombo(null);
          }}
        />
      )}
    </div>
  );
}
