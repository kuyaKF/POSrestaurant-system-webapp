import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, StaffRole } from "@prisma/client";

const prisma = new PrismaClient();

// Kept local to the seed script (not imported from src/lib/pin.ts) so the
// seed/migration tooling doesn't couple to app source.
function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const menuItemImagesDir = path.join(__dirname, "..", "uploads", "menu-items");
fs.mkdirSync(menuItemImagesDir, { recursive: true });

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

// Generates a simple, offline placeholder "photo" per dish (a tinted card in
// the dish's category color with an emoji + name) so every seeded item has
// something to render through the real image pipeline, without fetching any
// copyrighted photos from the web.
function writePlaceholderImage(name: string, emoji: string, color: string): string {
  const fileName = `${slugify(name)}.svg`;
  const filePath = path.join(menuItemImagesDir, fileName);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <rect width="480" height="360" fill="${color}"/>
  <rect width="480" height="360" fill="#000000" opacity="0.15"/>
  <text x="240" y="165" font-size="110" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  <text x="240" y="275" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeXml(name)}</text>
</svg>`;
  fs.writeFileSync(filePath, svg, "utf8");
  return `/uploads/menu-items/${fileName}`;
}

interface MenuItemSeed {
  name: string;
  legacyName?: string; // matches an older/generic seed row so we rename it in place instead of duplicating
  price: number; // pesos, converted to centavos below
  emoji: string;
}

async function main() {
  const tableCapacities = [2, 2, 4, 4, 4, 6, 6, 8, 10];
  for (let i = 0; i < tableCapacities.length; i++) {
    const number = i + 1;
    await prisma.table.upsert({
      where: { number },
      update: {},
      create: { number, capacity: tableCapacities[i] },
    });
  }

  // Demo PINs only — each staff's id repeated 4x, so they're trivially
  // memorable for testing. Never surfaced in the UI.
  const staffList = [
    { id: 1, name: "Mara Santos", role: StaffRole.MANAGER, pin: "1111" },
    { id: 2, name: "Bea Cruz", role: StaffRole.SERVER, pin: "2222" },
    { id: 3, name: "Cy Reyes", role: StaffRole.SERVER, pin: "3333" },
    { id: 4, name: "Dan Ortiz", role: StaffRole.SERVER, pin: "4444" },
    { id: 5, name: "Ella Ramos", role: StaffRole.SERVER, pin: "5555" },
    { id: 6, name: "Fabio Lim", role: StaffRole.KITCHEN, pin: "6666" },
    { id: 7, name: "Grace Uy", role: StaffRole.KITCHEN, pin: "7777" },
  ];
  for (const staff of staffList) {
    const pinHash = hashPin(staff.pin);
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: { name: staff.name, role: staff.role, pinHash },
      create: { id: staff.id, name: staff.name, role: staff.role, pinHash },
    });
  }

  // Categories mirror how most casual Filipino restaurants / turo-turo print
  // their menu boards: Appetizers (pulutan), Main Course (ulam), Rice &
  // Noodles, Desserts, and Beverages (inumin).
  const categorySeeds = [
    { name: "Appetizers", color: "#f97316" },
    { name: "Main Course", color: "#3b82f6" },
    { name: "Rice & Noodles", color: "#ca8a04" },
    { name: "Desserts", color: "#ec4899" },
    { name: "Beverages", color: "#10b981" },
  ];
  const categories: Record<string, { id: number }> = {};
  for (const c of categorySeeds) {
    categories[c.name] = await prisma.category.upsert({
      where: { name: c.name },
      update: { color: c.color },
      create: { name: c.name, color: c.color },
    });
  }

  // Prices researched against typical 2024-2025 casual/turo-turo Filipino
  // restaurant menus (Metro Manila-ish pricing) — solo-serving prices, not
  // fine dining or sharing platters unless noted.
  const menuByCategory: Record<string, MenuItemSeed[]> = {
    Appetizers: [
      { name: "Lumpiang Shanghai", legacyName: "Spring Rolls", price: 140, emoji: "🌯" },
      { name: "Calamares", price: 190, emoji: "🦑" },
      { name: "Chicharon Bulaklak", price: 210, emoji: "🥓" },
      { name: "Tokwa't Baboy", price: 150, emoji: "🥘" },
      { name: "Kropek", price: 80, emoji: "🍤" },
    ],
    "Main Course": [
      { name: "Chicken Adobo", price: 180, emoji: "🍗" },
      { name: "Pork Sisig", price: 220, emoji: "🍖" },
      { name: "Sinigang na Baboy", price: 230, emoji: "🍲" },
      { name: "Kare-Kare", price: 280, emoji: "🥘" },
      { name: "Lechon Kawali", price: 230, emoji: "🍖" },
      { name: "Bicol Express", price: 190, emoji: "🌶️" },
      { name: "Beef Caldereta", legacyName: "Beef Steak", price: 260, emoji: "🍛" },
      { name: "Chicken Inasal", legacyName: "Grilled Chicken", price: 150, emoji: "🍗" },
      { name: "Crispy Pata", price: 480, emoji: "🍖" },
      { name: "Inihaw na Bangus", legacyName: "Grilled Salmon", price: 220, emoji: "🐟" },
    ],
    "Rice & Noodles": [
      { name: "Garlic Rice", price: 45, emoji: "🍚" },
      { name: "Plain Rice", price: 25, emoji: "🍚" },
      { name: "Pancit Canton", price: 150, emoji: "🍜" },
      { name: "Pancit Bihon", price: 140, emoji: "🍜" },
      { name: "Filipino-Style Sweet Spaghetti", legacyName: "Spaghetti Bolognese", price: 120, emoji: "🍝" },
    ],
    Desserts: [
      { name: "Halo-Halo", price: 120, emoji: "🍧" },
      { name: "Leche Flan", price: 75, emoji: "🍮" },
      { name: "Turon", price: 55, emoji: "🍌" },
      { name: "Buko Pandan", price: 75, emoji: "🥥" },
    ],
    Beverages: [
      { name: "Sago't Gulaman", price: 45, emoji: "🥤" },
      { name: "Buko Juice", price: 60, emoji: "🥥" },
      { name: "Calamansi Juice", legacyName: "Fresh Lemonade", price: 50, emoji: "🍋" },
      { name: "Iced Tea", price: 45, emoji: "🧊" },
      { name: "Softdrinks", legacyName: "Soda", price: 45, emoji: "🥤" },
      { name: "Bottled Water", price: 25, emoji: "💧" },
    ],
  };

  let itemCount = 0;
  for (const [categoryName, items] of Object.entries(menuByCategory)) {
    const categoryId = categories[categoryName].id;
    for (const item of items) {
      const imageUrl = writePlaceholderImage(item.name, item.emoji, categorySeeds.find((c) => c.name === categoryName)!.color);
      const price = item.price * 100;

      const existing = await prisma.menuItem.findFirst({
        where: { OR: [{ name: item.name }, ...(item.legacyName ? [{ name: item.legacyName }] : [])] },
      });
      if (existing) {
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: { name: item.name, price, categoryId, isActive: true, imageUrl },
        });
      } else {
        await prisma.menuItem.create({
          data: { name: item.name, price, categoryId, imageUrl },
        });
      }
      itemCount++;
    }
  }

  // Older generic placeholder items with no authentic Filipino counterpart
  // are retired rather than deleted, since real orders may already
  // reference them — deactivating just hides them from ordering going
  // forward.
  await prisma.menuItem.updateMany({
    where: { name: { in: ["Nachos Supreme", "Garlic Bread"] } },
    data: { isActive: false },
  });

  // Combos apply a percentage discount to whichever specific items fill
  // each category "slot" at order time. Discount tiers mirror common
  // Filipino resto/fast-food promo patterns: modest (~10%) for a solo meal
  // deal, a bit more for a merienda/pulutan pairing, and the steepest
  // discount reserved for bigger group bundles.
  const comboSeeds = [
    {
      name: "Solo Ulam Meal",
      discountPercent: 10,
      slotCategories: ["Main Course", "Rice & Noodles", "Beverages"],
    },
    {
      name: "Barkada Pulutan Set",
      discountPercent: 15,
      slotCategories: ["Appetizers", "Appetizers", "Beverages"],
    },
    {
      name: "Merienda Combo",
      discountPercent: 12,
      slotCategories: ["Desserts", "Beverages"],
    },
    {
      name: "Family Feast Bundle",
      discountPercent: 18,
      slotCategories: ["Main Course", "Main Course", "Rice & Noodles", "Beverages", "Beverages"],
    },
  ];

  for (const combo of comboSeeds) {
    const slotCategoryIds = combo.slotCategories.map((name) => categories[name].id);
    const existing = await prisma.combo.findFirst({ where: { name: combo.name } });
    if (existing) {
      await prisma.comboSlot.deleteMany({ where: { comboId: existing.id } });
      await prisma.combo.update({
        where: { id: existing.id },
        data: {
          discountPercent: combo.discountPercent,
          isActive: true,
          slots: { create: slotCategoryIds.map((categoryId, sortOrder) => ({ categoryId, sortOrder })) },
        },
      });
    } else {
      await prisma.combo.create({
        data: {
          name: combo.name,
          discountPercent: combo.discountPercent,
          slots: { create: slotCategoryIds.map((categoryId, sortOrder) => ({ categoryId, sortOrder })) },
        },
      });
    }
  }

  console.log(
    `Seed complete. ${tableCapacities.length} tables, ${staffList.length} staff, ${itemCount} menu items, ${comboSeeds.length} combos.`
  );
  console.log("\nDemo staff PINs (login via the header staff switcher):");
  for (const staff of staffList) {
    console.log(`  ${staff.name.padEnd(14)} ${staff.role.padEnd(8)} PIN: ${staff.pin}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
