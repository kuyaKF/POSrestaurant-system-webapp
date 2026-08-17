import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Staff } from "../types";
import { fetchStaff } from "../api/staff";

const STORAGE_KEY = "pos_current_staff_id";

interface CurrentStaffContextValue {
  staff: Staff[];
  currentStaff: Staff | null;
  setCurrentStaffId: (id: number) => void;
  loading: boolean;
  refreshStaff: () => void;
}

const CurrentStaffContext = createContext<CurrentStaffContextValue | undefined>(undefined);

export function CurrentStaffProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [currentStaffId, setCurrentStaffIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchStaff()
      .then(setStaff)
      .finally(() => setLoading(false));
  }, [refreshToken]);

  const setCurrentStaffId = (id: number) => {
    setCurrentStaffIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  };

  const currentStaff = useMemo(
    () => staff.find((s) => s.id === currentStaffId) ?? null,
    [staff, currentStaffId]
  );

  const value: CurrentStaffContextValue = {
    staff,
    currentStaff,
    setCurrentStaffId,
    loading,
    refreshStaff: () => setRefreshToken((t) => t + 1),
  };

  return <CurrentStaffContext.Provider value={value}>{children}</CurrentStaffContext.Provider>;
}

export function useCurrentStaff() {
  const ctx = useContext(CurrentStaffContext);
  if (!ctx) throw new Error("useCurrentStaff must be used within CurrentStaffProvider");
  return ctx;
}
