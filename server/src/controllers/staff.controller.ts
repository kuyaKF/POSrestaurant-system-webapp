import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";

const listStaffQuerySchema = z.object({
  activeOnly: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export async function listStaff(req: Request, res: Response) {
  const { activeOnly } = listStaffQuerySchema.parse(req.query);
  const staff = await prisma.staff.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
  });
  res.json(staff);
}
