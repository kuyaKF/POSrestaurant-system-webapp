export interface CategoryCount {
  name: string;
  color: string;
  count: number;
}

export function CategorySummary({ breakdown }: { breakdown: CategoryCount[] }) {
  if (breakdown.length === 0) return null;

  return (
    <div className="category-summary">
      {breakdown.map((entry) => (
        <span className="category-summary-chip" key={entry.name}>
          <span className="category-summary-dot" style={{ backgroundColor: entry.color }} />
          {entry.count} {entry.name}
        </span>
      ))}
    </div>
  );
}
