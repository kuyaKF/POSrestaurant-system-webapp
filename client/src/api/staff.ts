import { apiGet, apiSend } from "./client";
import { Staff } from "../types";

export function fetchStaff(): Promise<Staff[]> {
  return apiGet<Staff[]>("/api/staff");
}

export function loginStaff(id: number, pin: string): Promise<Staff> {
  return apiSend<Staff>(`/api/staff/${id}/login`, "POST", { pin });
}
