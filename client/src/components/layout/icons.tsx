type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconBoard({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M15 4v16" />
    </svg>
  );
}

export function IconNewOrder({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconKitchen({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 11h14v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-3z" />
      <path d="M3 11h18" />
      <path d="M7 11l1-3M17 11l-1-3" />
      <circle cx="12" cy="6" r="1" />
    </svg>
  );
}

export function IconInventory({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}
