import { useState } from "react";
import { Staff, StaffRole } from "../../types";
import { useCurrentStaff } from "../../context/CurrentStaffContext";
import { PinConfirmModal } from "./PinConfirmModal";

const ROLE_LABEL: Record<StaffRole, string> = {
  MANAGER: "Manager",
  SERVER: "Server",
  KITCHEN: "Kitchen",
};

export function StaffSelector() {
  const { staff, currentStaff, loading } = useCurrentStaff();
  const [pendingStaff, setPendingStaff] = useState<Staff | null>(null);

  return (
    <div className="staff-selector">
      <label htmlFor="staff-select">Staff</label>
      <select
        id="staff-select"
        className="select"
        value={currentStaff?.id ?? ""}
        disabled={loading || staff.length === 0}
        onChange={(e) => {
          const next = staff.find((s) => s.id === Number(e.target.value));
          if (next) setPendingStaff(next);
        }}
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

      {pendingStaff && (
        <PinConfirmModal
          staff={pendingStaff}
          onClose={() => setPendingStaff(null)}
          onSuccess={() => setPendingStaff(null)}
        />
      )}
    </div>
  );
}
