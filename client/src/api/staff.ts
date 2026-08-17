import { apiGet } from "./client";
import { Staff } from "../types";

export function fetchStaff(): Promise<Staff[]> {
  return apiGet<Staff[]>("/api/staff");
}
