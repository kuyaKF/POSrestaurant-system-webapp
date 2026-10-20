import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { HttpError } from "../middleware/errorHandler";
import { requireStaffWithRole } from "../lib/authorize";
import { businessDayRange } from "../lib/businessDay";

const readingQuerySchema = z.object({
  date: z.string().trim().optional(),
  staffId: z.coerce.number().int().positive(),
});

const zReadingBodySchema = z.object({
  date: z.string().trim().optional(),
  staffId: z.coerce.number().int().positive(),
});

const listReadingsQuerySchema = z.object({
  staffId: z.coerce.number().int().positive(),
});

async function computeSalesAggregate(start: Date, end: Date) {
  const fulfilled = await prisma.order.findMany({
    where: { status: "PAYMENT_FULFILLED", statusChangedAt: { gte: start, lte: end } },
    select: { vatableSales: true, vatAmount: true, vatExemptSales: true, discountAmount: true, total: true },
  });
  const cancelledCount = await prisma.order.count({
    where: { status: "CANCELLED", statusChangedAt: { gte: start, lte: end } },
  });

  const sums = fulfilled.reduce(
    (acc, o) => ({
      vatableSales: acc.vatableSales + o.vatableSales,
      vatAmount: acc.vatAmount + o.vatAmount,
      vatExemptSales: acc.vatExemptSales + o.vatExemptSales,
      discountTotal: acc.discountTotal + o.discountAmount,
      netSales: acc.netSales + o.total,
    }),
    { vatableSales: 0, vatAmount: 0, vatExemptSales: 0, discountTotal: 0, netSales: 0 }
  );

  // Gross = what the bill would have been before any Senior/PWD discount.
  const grossSales = sums.vatableSales + sums.vatAmount + sums.vatExemptSales + sums.discountTotal;

  return { ...sums, grossSales, transactionCount: fulfilled.length, cancelledCount };
}

export async function getXReading(req: Request, res: Response) {
  const { date, staffId } = readingQuerySchema.parse(req.query);
  await requireStaffWithRole(staffId, ["MANAGER", "SERVER"]);

  const { businessDate, start, end } = businessDayRange(date);
  const aggregate = await computeSalesAggregate(start, end);

  const reading = await prisma.dailyReading.create({
    data: { type: "X", businessDate, periodStart: start, periodEnd: end, generatedById: staffId, ...aggregate },
    include: { generatedBy: { select: { id: true, name: true, role: true } } },
  });
  res.status(201).json(reading);
}

// A Z-reading is a formal close — only one is allowed per business day, and
// only a Manager can perform it. This app doesn't implement full fiscal-
// device semantics (sequential OR numbers, a non-resettable grand-total
// accumulator) — it's a closing snapshot record, not a BIR CAS-accredited
// device.
export async function postZReading(req: Request, res: Response) {
  const { date, staffId } = zReadingBodySchema.parse(req.body);
  await requireStaffWithRole(staffId, ["MANAGER"]);

  const { businessDate, start, end } = businessDayRange(date);

  const existing = await prisma.dailyReading.findFirst({ where: { type: "Z", businessDate } });
  if (existing) {
    throw new HttpError(409, "This business day has already been closed with a Z-reading");
  }

  const aggregate = await computeSalesAggregate(start, end);
  const reading = await prisma.dailyReading.create({
    data: { type: "Z", businessDate, periodStart: start, periodEnd: end, generatedById: staffId, ...aggregate },
    include: { generatedBy: { select: { id: true, name: true, role: true } } },
  });
  res.status(201).json(reading);
}

export async function listReadings(req: Request, res: Response) {
  const { staffId } = listReadingsQuerySchema.parse(req.query);
  await requireStaffWithRole(staffId, ["MANAGER", "SERVER"]);

  const readings = await prisma.dailyReading.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { generatedBy: { select: { id: true, name: true, role: true } } },
  });
  res.json(readings);
}
