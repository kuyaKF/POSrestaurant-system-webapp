import { apiGet, apiSend } from "./client";
import { DailyReading } from "../types";

export function fetchXReading(staffId: number, date?: string): Promise<DailyReading> {
  const query = date ? `&date=${date}` : "";
  return apiGet<DailyReading>(`/api/reports/x-reading?staffId=${staffId}${query}`);
}

export function postZReading(staffId: number, date?: string): Promise<DailyReading> {
  return apiSend<DailyReading>("/api/reports/z-reading", "POST", { staffId, date });
}

export function fetchReadings(staffId: number): Promise<DailyReading[]> {
  return apiGet<DailyReading[]>(`/api/reports/readings?staffId=${staffId}`);
}
