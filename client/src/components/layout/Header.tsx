import { NavLink } from "react-router-dom";
import { useCurrentStaff } from "../../context/CurrentStaffContext";
import { StaffSelector } from "./StaffSelector";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const { currentStaff } = useCurrentStaff();
  const canSeeReports = !!currentStaff && currentStaff.role !== "KITCHEN";

  return (
    <header className="app-header">
      <span className="app-title">Restaurant POS</span>
      <nav className="app-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Board
        </NavLink>
        <NavLink to="/new-order" className={({ isActive }) => (isActive ? "active" : "")}>
          New Order
        </NavLink>
        <NavLink to="/kitchen" className={({ isActive }) => (isActive ? "active" : "")}>
          Kitchen
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => (isActive ? "active" : "")}>
          Inventory
        </NavLink>
        {canSeeReports && (
          <NavLink to="/reports" className={({ isActive }) => (isActive ? "active" : "")}>
            Reports
          </NavLink>
        )}
      </nav>
      <div className="app-header-actions">
        <ThemeToggle />
        <StaffSelector />
      </div>
    </header>
  );
}
