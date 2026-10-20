import { NavLink } from "react-router-dom";
import { useCurrentStaff } from "../../context/CurrentStaffContext";
import { IconBoard, IconInventory, IconKitchen, IconNewOrder, IconReports } from "./icons";

const TABS = [
  { to: "/", label: "Board", Icon: IconBoard, end: true },
  { to: "/new-order", label: "New Order", Icon: IconNewOrder, end: false },
  { to: "/kitchen", label: "Kitchen", Icon: IconKitchen, end: false },
  { to: "/inventory", label: "Inventory", Icon: IconInventory, end: false },
];

const REPORTS_TAB = { to: "/reports", label: "Reports", Icon: IconReports, end: false };

export function BottomNav() {
  const { currentStaff } = useCurrentStaff();
  const tabs = currentStaff && currentStaff.role !== "KITCHEN" ? [...TABS, REPORTS_TAB] : TABS;

  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, label, Icon, end }) => (
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
