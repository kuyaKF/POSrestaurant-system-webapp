import { OrderStatus } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../middleware/errorHandler";
import { assertTransition } from "./orderStateMachine";
import { emitOrdersChanged } from "./orderEvents";

const ORDER_INCLUDE = {
  table: true,
  server: true,
  items: true,
  combos: true,
  statusLogs: { orderBy: { changedAt: "asc" as const }, include: { changedBy: true } },
};

export async function transitionOrder(
  orderId: number,
  expectedFrom: OrderStatus,
  toStatus: OrderStatus,
  staffId: number
) {
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.isActive) throw new HttpError(400, "Invalid or inactive staff member");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");

  assertTransition(order.status, expectedFrom, toStatus);

  const isNewRound = expectedFrom === "SERVED" && toStatus === "PREPARING";

  const updated = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        statusChangedAt: new Date(),
        ...(isNewRound ? { currentRound: { increment: 1 } } : {}),
      },
    });

    await tx.orderStatusLog.create({
      data: {
        orderId,
        fromStatus: expectedFrom,
        toStatus,
        changedById: staffId,
      },
    });

    if ((toStatus === "PAYMENT_FULFILLED" || toStatus === "CANCELLED") && order.tableId !== null) {
      await tx.table.update({ where: { id: order.tableId }, data: { isOccupied: false } });
    }

    return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
  });

  emitOrdersChanged();
  return updated;
}

export { ORDER_INCLUDE };
