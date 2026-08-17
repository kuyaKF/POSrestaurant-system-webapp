import { useState } from "react";
import { OrderStatusLog } from "../../types";
import { statusMeta } from "../../lib/color";
import { formatDateTime } from "../../lib/format";

export function StatusHistory({ logs }: { logs: OrderStatusLog[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="status-history">
      <button type="button" className="status-history-toggle" onClick={() => setExpanded((e) => !e)}>
        {expanded ? "Hide" : "Show"} status history ({logs.length})
      </button>
      {expanded && (
        <ul className="status-history-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span>
                {log.fromStatus ? `${statusMeta(log.fromStatus).label} → ` : ""}
                {statusMeta(log.toStatus).label}
              </span>
              <span className="status-history-meta">
                {log.changedBy.name} · {formatDateTime(log.changedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
