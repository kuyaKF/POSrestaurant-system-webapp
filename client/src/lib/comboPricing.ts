// The combo's discount applies to the sum of the actual items selected to
// fill its slots — not an abstract category estimate — so the price only
// exists once specific items are picked (mirrors server/src/lib/comboPricing.ts).
export function applyComboDiscount(subtotal: number, discountPercent: number): number {
  return Math.max(0, Math.round(subtotal * (1 - discountPercent / 100)));
}
