const centavosToPesos = (centavos: number) => centavos / 100;

export function formatCurrency(centavos: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(centavosToPesos(centavos));
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatElapsed(fromIso: string): string {
  const ms = Date.now() - new Date(fromIso).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${String(remMinutes).padStart(2, "0")}m`;
}
