import { apiGet } from "./client";
import { Table } from "../types";

export function fetchTables(): Promise<Table[]> {
  return apiGet<Table[]>("/api/tables");
}
