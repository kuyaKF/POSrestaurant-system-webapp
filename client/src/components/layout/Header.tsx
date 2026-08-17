import { NavLink } from "react-router-dom";
import { StaffSelector } from "./StaffSelector";

export function Header() {
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
      </nav>
      <StaffSelector />
    </header>
  );
}
