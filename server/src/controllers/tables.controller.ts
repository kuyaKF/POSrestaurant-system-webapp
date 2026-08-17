import { Request, Response } from "express";
import { prisma } from "../db";
import { HttpError } from "../middleware/errorHandler";

export async function listTables(_req: Request, res: Response) {
  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
    include: {
      orders: {
        where: { status: { not: "PAYMENT_FULFILLED" } },
        select: { id: true, status: true },
        take: 1,
      },
    },
  });
  res.json(tables);
}

export async function getTable(req: Request, res: Response) {
  const id = Number(req.params.id);
  const table = await prisma.table.findUnique({
    where: { id },
    include: {
      orders: {
        where: { status: { not: "PAYMENT_FULFILLED" } },
        select: { id: true, status: true },
        take: 1,
      },
    },
  });
  if (!table) throw new HttpError(404, "Table not found");
  res.json(table);
}
