import { Category, MenuItem, OrderItem } from "../types";

export function buildMenuItemCategoryMap(menuItems: MenuItem[]): Map<number, Category> {
  return new Map(menuItems.map((mi) => [mi.id, mi.category]));
}

// Group items by category so a ticket reads as one section at a time,
// instead of in whatever order the items were added.
export function sortItemsByCategory<T extends OrderItem>(
  items: T[],
  menuItemCategoryById: Map<number, Category>
): T[] {
  return [...items].sort((a, b) => {
    const nameA = menuItemCategoryById.get(a.menuItemId)?.name;
    const nameB = menuItemCategoryById.get(b.menuItemId)?.name;
    if (!nameA && !nameB) return 0;
    if (!nameA) return 1;
    if (!nameB) return -1;
    return nameA.localeCompare(nameB);
  });
}
