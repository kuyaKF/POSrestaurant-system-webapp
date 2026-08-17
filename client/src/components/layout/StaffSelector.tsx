import { StaffRole } from "../../types";
import { useCurrentStaff } from "../../context/CurrentStaffContext";

const ROLE_LABEL: Record<StaffRole, string> = {
  MANAGER: "Manager",
  SERVER: "Server",
  KITCHEN: "Kitchen",
};

export function StaffSelector() {
  const { staff, currentStaff, setCurrentStaffId, loading } = useCurrentStaff();

  return (
    <div className="staff-selector">
      <label htmlFor="staff-select">Staff</label>
      <select
        id="staff-select"
        className="select"
        value={currentStaff?.id ?? ""}
        disabled={loading || staff.length === 0}
        onChange={(e) => setCurrentStaffId(Number(e.target.value))}
      >
        <option value="" disabled>
          {loading ? "Loading…" : "Select staff"}
        </option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({ROLE_LABEL[s.role]})
          </option>
        ))}
      </select>
    </div>
  );
}
