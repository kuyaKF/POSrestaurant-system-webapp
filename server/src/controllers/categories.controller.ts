import { Request, Response } from "express";
import { prisma } from "../db";

export async function listCategories(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json(categories);
}
