import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { HttpError } from "../middleware/errorHandler";
import { verifyPin } from "../lib/pin";

const STAFF_SAFE_SELECT = {
  id: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

const listStaffQuerySchema = z.object({
  activeOnly: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

const loginSchema = z.object({
  pin: z.string().trim().min(4).max(8),
});

export async function listStaff(req: Request, res: Response) {
  const { activeOnly } = listStaffQuerySchema.parse(req.query);
  const staff = await prisma.staff.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    select: STAFF_SAFE_SELECT,
    orderBy: { name: "asc" },
  });
  res.json(staff);
}

export async function loginStaff(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { pin } = loginSchema.parse(req.body);

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff || !staff.isActive || !staff.pinHash || !verifyPin(pin, staff.pinHash)) {
    throw new HttpError(401, "Incorrect PIN");
  }

  const { pinHash: _pinHash, ...safeStaff } = staff;
  res.json(safeStaff);
}
