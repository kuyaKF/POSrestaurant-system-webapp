import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { HttpError } from "../middleware/errorHandler";

const listMenuItemsQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  activeOnly: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

const createMenuItemSchema = z.object({
  name: z.string().trim().min(1),
  price: z.coerce.number().int().nonnegative(),
  categoryId: z.coerce.number().int().positive(),
});

const updateMenuItemSchema = z.object({
  name: z.string().trim().min(1).optional(),
  price: z.coerce.number().int().nonnegative().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function listMenuItems(req: Request, res: Response) {
  const { categoryId, activeOnly } = listMenuItemsQuerySchema.parse(req.query);

  const where: Record<string, unknown> = {};
  if (activeOnly) where.isActive = true;
  if (categoryId) where.categoryId = categoryId;

  const menuItems = await prisma.menuItem.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });
  res.json(menuItems);
}

export async function createMenuItem(req: Request, res: Response) {
  const data = createMenuItemSchema.parse(req.body);

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new HttpError(404, "Category not found");

  const menuItem = await prisma.menuItem.create({ data, include: { category: true } });
  res.status(201).json(menuItem);
}

export async function updateMenuItem(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = updateMenuItemSchema.parse(req.body);

  const existing = await prisma.menuItem.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Menu item not found");

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new HttpError(404, "Category not found");
  }

  const menuItem = await prisma.menuItem.update({ where: { id }, data, include: { category: true } });
  res.json(menuItem);
}

export async function deleteMenuItem(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.menuItem.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Menu item not found");

  await prisma.menuItem.delete({ where: { id } });
  res.status(204).send();
}
