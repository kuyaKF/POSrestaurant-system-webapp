import { Table } from "../../types";

export function TableCard({
  table,
  selected,
  onClick,
}: {
  table: Table;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`table-card ${table.isOccupied ? "table-card--occupied" : ""} ${selected ? "table-card--selected" : ""}`}
      onClick={onClick}
      disabled={table.isOccupied}
    >
      <div className="table-card-number">Table {table.number}</div>
      <div className="table-card-capacity">Seats {table.capacity}</div>
      <span className={`badge ${table.isOccupied ? "badge-occupied" : "badge-available"}`}>
        {table.isOccupied ? "Occupied" : "Available"}
      </span>
    </button>
  );
}
