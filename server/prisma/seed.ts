import { PrismaClient, StaffRole } from "@prisma/client";

const prisma = new PrismaClient();

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

  const staffList = [
    { id: 1, name: "Mara Santos", role: StaffRole.MANAGER },
    { id: 2, name: "Bea Cruz", role: StaffRole.SERVER },
    { id: 3, name: "Cy Reyes", role: StaffRole.SERVER },
    { id: 4, name: "Dan Ortiz", role: StaffRole.SERVER },
    { id: 5, name: "Ella Ramos", role: StaffRole.SERVER },
    { id: 6, name: "Fabio Lim", role: StaffRole.KITCHEN },
    { id: 7, name: "Grace Uy", role: StaffRole.KITCHEN },
  ];
  for (const staff of staffList) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: { name: staff.name, role: staff.role },
      create: staff,
    });
  }

  const appetizers = await prisma.category.upsert({
    where: { name: "Appetizers" },
    update: {},
    create: { name: "Appetizers", color: "#f97316" },
  });
  const mainCourse = await prisma.category.upsert({
    where: { name: "Main Course" },
    update: {},
    create: { name: "Main Course", color: "#3b82f6" },
  });
  const beverages = await prisma.category.upsert({
    where: { name: "Beverages" },
    update: {},
    create: { name: "Beverages", color: "#10b981" },
  });

  const menuItems = [
    // Appetizers (price in centavos)
    { name: "Spring Rolls", price: 12000, categoryId: appetizers.id },
    { name: "Calamares", price: 18000, categoryId: appetizers.id },
    { name: "Nachos Supreme", price: 16000, categoryId: appetizers.id },
    { name: "Garlic Bread", price: 9000, categoryId: appetizers.id },

    // Main Course
    { name: "Grilled Chicken", price: 28000, categoryId: mainCourse.id },
    { name: "Beef Steak", price: 38000, categoryId: mainCourse.id },
    { name: "Grilled Salmon", price: 42000, categoryId: mainCourse.id },
    { name: "Pork Sisig", price: 24000, categoryId: mainCourse.id },
    { name: "Spaghetti Bolognese", price: 19000, categoryId: mainCourse.id },

    // Beverages
    { name: "Iced Tea", price: 6000, categoryId: beverages.id },
    { name: "Fresh Lemonade", price: 7500, categoryId: beverages.id },
    { name: "Soda", price: 5500, categoryId: beverages.id },
    { name: "Bottled Water", price: 4000, categoryId: beverages.id },
  ];

  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.menuItem.create({ data: item });
    }
  }

  console.log(`Seed complete. ${tableCapacities.length} tables, ${staffList.length} staff, ${menuItems.length} menu items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
