import { Order, OrderStatus } from "../../types";
import { statusMeta } from "../../lib/color";
import { OrderCard } from "./OrderCard";
import { EmptyState } from "../common/EmptyState";

export function OrderColumn({
  status,
  orders,
  onMarkServed,
  onCancel,
}: {
  status: OrderStatus;
  orders: Order[];
  onMarkServed?: (orderId: number) => void;
  onCancel?: (orderId: number) => Promise<unknown> | void;
}) {
  const meta = statusMeta(status);
  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <span className="kanban-column-dot" style={{ backgroundColor: meta.color }} />
        <span className="kanban-column-title">{meta.label}</span>
        <span className="kanban-column-count">{orders.length}</span>
      </div>
      <div className="kanban-column-body">
        {orders.length === 0 ? (
          <EmptyState message="No orders" />
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} onMarkServed={onMarkServed} onCancel={onCancel} />
          ))
        )}
      </div>
    </div>
  );
}
