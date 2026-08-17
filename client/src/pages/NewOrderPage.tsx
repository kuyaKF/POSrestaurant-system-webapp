import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrderType, Table } from "../types";
import { fetchTables } from "../api/tables";
import { createOrder } from "../api/orders";
import { ApiError } from "../api/client";
import { useCurrentStaff } from "../context/CurrentStaffContext";
import { Loading } from "../components/common/Loading";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { EmptyState } from "../components/common/EmptyState";
import { TableCard } from "../components/tables/TableCard";

export function NewOrderPage() {
  const navigate = useNavigate();
  const { currentStaff } = useCurrentStaff();
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [partySize, setPartySize] = useState("2");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTables()
      .then(setTables)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load tables"))
      .finally(() => setLoading(false));
  }, []);

  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;
  const partySizeNumber = Number(partySize);
  const canStart =
    !!currentStaff &&
    !creating &&
    (orderType === "TAKEOUT" ||
      (!!selectedTable && Number.isInteger(partySizeNumber) && partySizeNumber > 0));

  const handleOrderTypeChange = (next: OrderType) => {
    setOrderType(next);
    setSelectedTableId(null);
  };

  const handleStart = async () => {
    if (!currentStaff) return;
    if (orderType === "DINE_IN" && !selectedTable) return;
    setCreating(true);
    setError(null);
    try {
      const order = await createOrder(
        orderType === "DINE_IN"
          ? { orderType: "DINE_IN", tableId: selectedTable!.id, partySize: partySizeNumber, serverId: currentStaff.id }
          : { orderType: "TAKEOUT", serverId: currentStaff.id }
      );
      navigate(`/orders/${order.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to start order");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>New Order</h1>
      </div>

      {!currentStaff && <ErrorBanner message="Select a server from the header before starting an order." />}
      {error && <ErrorBanner message={error} />}

      <div className="order-type-toggle">
        <button
          type="button"
          className={`order-type-toggle-btn ${orderType === "DINE_IN" ? "active" : ""}`}
          onClick={() => handleOrderTypeChange("DINE_IN")}
        >
          Dine In
        </button>
        <button
          type="button"
          className={`order-type-toggle-btn ${orderType === "TAKEOUT" ? "active" : ""}`}
          onClick={() => handleOrderTypeChange("TAKEOUT")}
        >
          Takeout
        </button>
      </div>

      {orderType === "DINE_IN" ? (
        loading ? (
          <Loading />
        ) : tables.length === 0 ? (
          <EmptyState message="No tables configured." />
        ) : (
          <div className="new-order-layout">
            <div className="table-grid">
              {tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  selected={table.id === selectedTableId}
                  onClick={() => setSelectedTableId(table.id)}
                />
              ))}
            </div>

            <div className="card new-order-panel" style={{ padding: 16 }}>
              <h2 style={{ marginTop: 0, fontSize: 16 }}>Seat Guests</h2>
              {selectedTable ? (
                <p className="new-order-panel-meta">
                  Table {selectedTable.number} · seats {selectedTable.capacity}
                </p>
              ) : (
                <p className="new-order-panel-meta">Pick an available table to continue.</p>
              )}

              <div className="form-row">
                <label>Party Size</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={!canStart}
                onClick={handleStart}
              >
                {creating ? "Starting…" : "Start Order"}
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="card new-order-panel new-order-panel--takeout" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Takeout Order</h2>
          <p className="new-order-panel-meta">
            No table needed — this order goes straight to the kitchen and stays out of the table grid.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={!canStart}
            onClick={handleStart}
          >
            {creating ? "Starting…" : "Start Takeout Order"}
          </button>
        </div>
      )}
    </div>
  );
}
