import { OrderStatus } from "../../types";
import { statusMeta } from "../../lib/color";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = statusMeta(status);
  return (
    <span className="status-badge" style={{ backgroundColor: meta.color }}>
      {meta.label}
    </span>
  );
}
