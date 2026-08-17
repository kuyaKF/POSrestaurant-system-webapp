import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { HttpError } from "../middleware/errorHandler";

const COMBO_INCLUDE = {
  slots: { include: { category: true }, orderBy: { sortOrder: "asc" as const } },
};

const comboSlotInputSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
});

const createComboSchema = z.object({
  name: z.string().trim().min(1),
  discountPercent: z.coerce.number().int().min(0).max(100),
  slots: z.array(comboSlotInputSchema).min(1, "A combo needs at least one slot"),
});

const updateComboSchema = z.object({
  name: z.string().trim().min(1).optional(),
  discountPercent: z.coerce.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  slots: z.array(comboSlotInputSchema).min(1).optional(),
});

const listCombosQuerySchema = z.object({
  activeOnly: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

async function assertCategoriesExist(categoryIds: number[]) {
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const foundIds = new Set(categories.map((c) => c.id));
  for (const id of categoryIds) {
    if (!foundIds.has(id)) throw new HttpError(400, `Category ${id} not found`);
  }
}

export async function listCombos(req: Request, res: Response) {
  const { activeOnly } = listCombosQuerySchema.parse(req.query);
  const combos = await prisma.combo.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: COMBO_INCLUDE,
    orderBy: { name: "asc" },
  });
  res.json(combos);
}

export async function createCombo(req: Request, res: Response) {
  const { name, discountPercent, slots } = createComboSchema.parse(req.body);
  await assertCategoriesExist(slots.map((s) => s.categoryId));

  const combo = await prisma.combo.create({
    data: {
      name,
      discountPercent,
      slots: { create: slots.map((s, i) => ({ categoryId: s.categoryId, sortOrder: i })) },
    },
    include: COMBO_INCLUDE,
  });
  res.status(201).json(combo);
}

export async function updateCombo(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { name, discountPercent, isActive, slots } = updateComboSchema.parse(req.body);

  const existing = await prisma.combo.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Combo not found");

  if (slots) {
    await assertCategoriesExist(slots.map((s) => s.categoryId));
  }

  const combo = await prisma.$transaction(async (tx) => {
    await tx.combo.update({ where: { id }, data: { name, discountPercent, isActive } });
    if (slots) {
      await tx.comboSlot.deleteMany({ where: { comboId: id } });
      await tx.comboSlot.createMany({
        data: slots.map((s, i) => ({ comboId: id, categoryId: s.categoryId, sortOrder: i })),
      });
    }
    return tx.combo.findUniqueOrThrow({ where: { id }, include: COMBO_INCLUDE });
  });

  res.json(combo);
}

export async function deleteCombo(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.combo.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Combo not found");

  await prisma.combo.delete({ where: { id } });
  res.status(204).send();
}
