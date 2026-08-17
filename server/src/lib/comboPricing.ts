// The combo's discount applies to the sum of the actual items selected to
// fill its slots at order time — not an abstract category estimate, since
// the customer might pick the cheapest or priciest option in each slot.
export function applyComboDiscount(subtotal: number, discountPercent: number): number {
  return Math.max(0, Math.round(subtotal * (1 - discountPercent / 100)));
}
