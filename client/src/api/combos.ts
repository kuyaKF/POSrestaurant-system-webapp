import { apiGet, apiSend } from "./client";
import { Combo } from "../types";

export function fetchCombos(opts?: { activeOnly?: boolean }): Promise<Combo[]> {
  const query = opts?.activeOnly === false ? "?activeOnly=false" : "";
  return apiGet<Combo[]>(`/api/combos${query}`);
}

export interface ComboInput {
  name: string;
  discountPercent: number;
  slots: { categoryId: number }[];
}

export function createCombo(input: ComboInput): Promise<Combo> {
  return apiSend<Combo>("/api/combos", "POST", input);
}

export function updateCombo(id: number, input: Partial<ComboInput> & { isActive?: boolean }): Promise<Combo> {
  return apiSend<Combo>(`/api/combos/${id}`, "PATCH", input);
}

export function deleteCombo(id: number): Promise<void> {
  return apiSend<void>(`/api/combos/${id}`, "DELETE");
}
