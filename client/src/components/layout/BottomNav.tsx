import { NavLink } from "react-router-dom";
import { IconBoard, IconInventory, IconKitchen, IconNewOrder } from "./icons";

const TABS = [
  { to: "/", label: "Board", Icon: IconBoard, end: true },
  { to: "/new-order", label: "New Order", Icon: IconNewOrder, end: false },
  { to: "/kitchen", label: "Kitchen", Icon: IconKitchen, end: false },
  { to: "/inventory", label: "Inventory", Icon: IconInventory, end: false },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `bottom-nav-tab ${isActive ? "active" : ""}`}
        >
          <Icon className="bottom-nav-icon" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
