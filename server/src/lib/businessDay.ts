import { HttpError } from "../middleware/errorHandler";

// A "business day" is a plain calendar day in server-local time — simplest
// and most predictable choice for a single-location restaurant; no
// configurable day-start-hour concept.
export function businessDayRange(dateStr?: string): { businessDate: Date; start: Date; end: Date } {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) {
    throw new HttpError(400, "Invalid date");
  }
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
  const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999);
  return { businessDate: start, start, end };
}
