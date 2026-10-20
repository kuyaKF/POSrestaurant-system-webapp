import { Request, Response } from "express";
import { z } from "zod";
import { Prisma, OrderStatus, DiscountType } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../middleware/errorHandler";
import { assertItemMutable, assertItemsAddable, assertOrderPreparing } from "../lib/orderStateMachine";
import { transitionOrder, ORDER_INCLUDE } from "../lib/orderTransitionService";
import { emitOrdersChanged } from "../lib/orderEvents";
import { applyComboDiscount } from "../lib/comboPricing";

const createOrderSchema = z.discriminatedUnion("orderType", [
  z.object({
    orderType: z.literal("DINE_IN"),
    tableId: z.coerce.number().int().positive(),
    partySize: z.coerce.number().int().positive(),
    serverId: z.coerce.number().int().positive(),
  }),
  z.object({
    orderType: z.literal("TAKEOUT"),
    serverId: z.coerce.number().int().positive(),
  }),
]);

const notesSchema = z
  .string()
  .trim()
  .max(200)
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

const addItemSchema = z.object({
  menuItemId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  notes: notesSchema,
});

const updateItemSchema = z.object({
  quantity: z.coerce.number().int().nonnegative(),
});

const setItemNotesSchema = z.object({
  notes: notesSchema,
});

const setItemReadySchema = z.object({
  ready: z.boolean(),
});

const setItemServedSchema = z.object({
  served: z.boolean(),
  staffId: z.coerce.number().int().positive(),
});

const setTakeoutSchema = z.object({
  isTakeout: z.boolean(),
});

const addComboSchema = z.object({
  comboId: z.coerce.number().int().positive(),
  selections: z
    .array(
      z.object({
        slotId: z.coerce.number().int().positive(),
        menuItemId: z.coerce.number().int().positive(),
      })
    )
    .min(1),
});

const setComboTakeoutSchema = z.object({
  isTakeout: z.boolean(),
});

const transitionBodySchema = z.object({
  staffId: z.coerce.number().int().positive(),
});

// `status` accepts a comma-separated list (e.g. "SEATED,PREPARING") so the
// board can fetch its active-pipeline columns in one request; `since`
// bounds terminal-state queries (e.g. Payment Fulfilled) to a recent
// window instead of the order's entire history.
const listOrdersQuerySchema = z.object({
  status: z.preprocess(
    (v) => (typeof v === "string" ? v.split(",") : v),
    z.array(z.nativeEnum(OrderStatus)).optional()
  ),
  since: z.coerce.date().optional(),
});

// Hard backstops so a single request can never return an unbounded number
// of orders, independent of whatever date/status filtering the caller used —
// e.g. an unusually high-volume day still caps at RECENT_ORDERS_LIMIT rather
// than however many orders were actually fulfilled that day.
const RECENT_ORDERS_LIMIT = 50;
const ORDERS_QUERY_LIMIT = 200;

const setDiscountSchema = z
  .object({
    discountType: z.nativeEnum(DiscountType).nullable(),
    idNumber: z.string().trim().min(1).max(50).nullable().optional(),
    name: z.string().trim().min(1).max(100).nullable().optional(),
  })
  .refine((data) => data.discountType === null || (data.idNumber && data.name), {
    message: "An ID number and name are required to apply a discount",
  });

const VAT_RATE = 0.12;
const SENIOR_PWD_DISCOUNT_RATE = 0.2;

// Menu prices are VAT-inclusive (as required by PH law). A Senior/PWD
// discount makes the whole order VAT-exempt and takes 20% off the
// VAT-exclusive base — the standard BIR computation. Without a discount, the
// order just reports its VATable/VAT split for the receipt.
async function recomputeOrderTotal(tx: Prisma.TransactionClient, orderId: number) {
  const [items, combos, order] = await Promise.all([
    tx.orderItem.findMany({ where: { orderId } }),
    tx.orderCombo.findMany({ where: { orderId } }),
    tx.order.findUniqueOrThrow({ where: { id: orderId } }),
  ]);
  // Combo component items carry a $0 price snapshot — their cost is folded
  // into the combo's own discounted price instead, so it isn't double-counted.
  const itemsTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const combosTotal = combos.reduce((sum, combo) => sum + combo.priceSnap, 0);
  const subtotal = itemsTotal + combosTotal;

  let vatableSales = 0;
  let vatExemptSales = 0;
  let vatAmount = 0;
  let discountAmount = 0;
  let total = subtotal;

  if (order.discountType) {
    vatExemptSales = Math.round(subtotal / (1 + VAT_RATE));
    discountAmount = Math.round(vatExemptSales * SENIOR_PWD_DISCOUNT_RATE);
    total = vatExemptSales - discountAmount;
  } else {
    vatableSales = Math.round(subtotal / (1 + VAT_RATE));
    vatAmount = subtotal - vatableSales;
    total = subtotal;
  }

  return tx.order.update({
    where: { id: orderId },
    data: { total, vatableSales, vatExemptSales, vatAmount, discountAmount },
    include: ORDER_INCLUDE,
  });
}

// Once every item across every round has been served, the order is done —
// this is what actually completes the PREPARING -> SERVED transition now,
// rather than a single whole-order button.
async function tryAutoCompleteOrder(orderId: number, staffId: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.status !== "PREPARING") return null;
  if (order.items.length === 0) return null;
  // On a reopened order, the current round must have its own items — otherwise
  // a round with nothing new added would trivially "complete" on the strength
  // of the previous round's items alone.
  if (order.currentRound > 1 && !order.items.some((item) => item.round === order.currentRound)) {
    return null;
  }
  if (order.items.some((item) => !item.served)) return null;

  const served = await transitionOrder(orderId, "PREPARING", "SERVED", staffId);
  // Takeout has no table to linger at between being served and paying —
  // handing over the bag is the payment moment, so skip straight to it.
  if (order.orderType === "TAKEOUT") {
    return transitionOrder(orderId, "SERVED", "PAYMENT_PENDING", staffId);
  }
  return served;
}

export async function createOrder(req: Request, res: Response) {
  const input = createOrderSchema.parse(req.body);

  const server = await prisma.staff.findUnique({ where: { id: input.serverId } });
  if (!server || !server.isActive) throw new HttpError(400, "Invalid or inactive staff member");

  if (input.orderType === "DINE_IN") {
    const table = await prisma.table.findUnique({ where: { id: input.tableId } });
    if (!table) throw new HttpError(404, "Table not found");
    if (table.isOccupied) throw new HttpError(409, "Table is already occupied");
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderType: input.orderType,
        tableId: input.orderType === "DINE_IN" ? input.tableId : null,
        partySize: input.orderType === "DINE_IN" ? input.partySize : 1,
        serverId: input.serverId,
        status: "SEATED",
      },
    });
    if (input.orderType === "DINE_IN") {
      await tx.table.update({ where: { id: input.tableId }, data: { isOccupied: true } });
    }
    await tx.orderStatusLog.create({
      data: { orderId: created.id, fromStatus: null, toStatus: "SEATED", changedById: input.serverId },
    });
    return tx.order.findUniqueOrThrow({ where: { id: created.id }, include: ORDER_INCLUDE });
  });

  emitOrdersChanged();
  res.status(201).json(order);
}

export async function listOrders(req: Request, res: Response) {
  const { status, since } = listOrdersQuerySchema.parse(req.query);
  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: { in: status } } : {}),
      ...(since ? { statusChangedAt: { gte: since } } : {}),
    },
    include: ORDER_INCLUDE,
    // `since` implies "recent completed orders" — sort by when they actually
    // finished rather than when they were opened, and cap tighter since this
    // is meant as a glance view, not full history.
    orderBy: since ? { statusChangedAt: "desc" } : { createdAt: "desc" },
    take: since ? RECENT_ORDERS_LIMIT : ORDERS_QUERY_LIMIT,
  });
  res.json(orders);
}

export async function getOrder(req: Request, res: Response) {
  const id = Number(req.params.id);
  const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!order) throw new HttpError(404, "Order not found");
  res.json(order);
}

export async function addOrderItem(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const { menuItemId, quantity, notes } = addItemSchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");
  assertItemsAddable(order.status);

  const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  if (!menuItem || !menuItem.isActive) throw new HttpError(400, "Menu item is not available");

  const updated = await prisma.$transaction(async (tx) => {
    // Only fold into a standalone line that hasn't started prep or been
    // served yet, in the current round, with the same notes — merging into a
    // ready/served line would silently mark this follow-up as already
    // prepared or delivered, merging differing notes would lose one of them,
    // and combo component lines are never a merge target.
    const existing = await tx.orderItem.findFirst({
      where: {
        orderId,
        menuItemId,
        ready: false,
        served: false,
        orderComboId: null,
        round: order.currentRound,
        notes,
      },
    });
    if (existing) {
      const newQuantity = existing.quantity + quantity;
      await tx.orderItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity, lineTotal: newQuantity * existing.unitPriceSnap },
      });
    } else {
      await tx.orderItem.create({
        data: {
          orderId,
          menuItemId,
          nameSnap: menuItem.name,
          unitPriceSnap: menuItem.price,
          quantity,
          lineTotal: menuItem.price * quantity,
          round: order.currentRound,
          notes,
        },
      });
    }
    return recomputeOrderTotal(tx, orderId);
  });

  emitOrdersChanged();
  res.status(201).json(updated);
}

export async function setOrderItemNotes(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const { notes } = setItemNotesSchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");

  const orderItem = await prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
  if (!orderItem) throw new HttpError(404, "Order item not found");
  if (orderItem.orderComboId !== null) {
    throw new HttpError(409, "This item is part of a combo — remove the whole combo instead");
  }
  assertItemMutable(order.status, orderItem.ready || orderItem.served);

  await prisma.orderItem.update({ where: { id: itemId }, data: { notes } });

  emitOrdersChanged();
  const updated = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
  res.json(updated);
}

export async function updateOrderItem(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const { quantity } = updateItemSchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");

  const orderItem = await prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
  if (!orderItem) throw new HttpError(404, "Order item not found");
  if (orderItem.orderComboId !== null) {
    throw new HttpError(409, "This item is part of a combo — remove the whole combo instead");
  }
  assertItemMutable(order.status, orderItem.ready || orderItem.served);

  const updated = await prisma.$transaction(async (tx) => {
    if (quantity === 0) {
      await tx.orderItem.delete({ where: { id: itemId } });
    } else {
      await tx.orderItem.update({
        where: { id: itemId },
        data: { quantity, lineTotal: quantity * orderItem.unitPriceSnap },
      });
    }
    return recomputeOrderTotal(tx, orderId);
  });

  emitOrdersChanged();
  res.json(updated);
}

export async function removeOrderItem(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const itemId = Number(req.params.itemId);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");

  const orderItem = await prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
  if (!orderItem) throw new HttpError(404, "Order item not found");
  if (orderItem.orderComboId !== null) {
    throw new HttpError(409, "This item is part of a combo — remove the whole combo instead");
  }
  assertItemMutable(order.status, orderItem.ready || orderItem.served);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.orderItem.delete({ where: { id: itemId } });
    return recomputeOrderTotal(tx, orderId);
  });

  emitOrdersChanged();
  res.json(updated);
}

// Kitchen crew flag a specific dish as prepared and ready to go out.
export async function setOrderItemReady(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const { ready } = setItemReadySchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");
  assertOrderPreparing(order.status);

  const orderItem = await prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
  if (!orderItem) throw new HttpError(404, "Order item not found");

  if (!ready && orderItem.served) {
    throw new HttpError(409, "Cannot unmark ready on an item that has already been served");
  }

  await prisma.orderItem.update({ where: { id: itemId }, data: { ready } });

  emitOrdersChanged();
  const updated = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
  res.json(updated);
}

// Server flags a specific dish as delivered to the table. Requires the
// kitchen to have marked it ready first — you can't deliver what isn't
// cooked. Completing the last item auto-advances the whole order to SERVED.
export async function setOrderItemServed(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const { served, staffId } = setItemServedSchema.parse(req.body);

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.isActive) throw new HttpError(400, "Invalid or inactive staff member");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");
  assertOrderPreparing(order.status);

  const orderItem = await prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
  if (!orderItem) throw new HttpError(404, "Order item not found");

  if (served && !orderItem.ready) {
    throw new HttpError(409, "This item must be marked ready by the kitchen before it can be served");
  }

  await prisma.orderItem.update({ where: { id: itemId }, data: { served } });

  const completed = served ? await tryAutoCompleteOrder(orderId, staffId) : null;
  if (completed) {
    res.json(completed);
    return;
  }

  emitOrdersChanged();
  const updated = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
  res.json(updated);
}

// Convenience for the board: mark every currently ready-but-undelivered item
// as served in one action, for a server picking up everything at once.
export async function serveReadyItems(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const { staffId } = transitionBodySchema.parse(req.body);

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.isActive) throw new HttpError(400, "Invalid or inactive staff member");

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new HttpError(404, "Order not found");
  assertOrderPreparing(order.status);

  const readyUnserved = order.items.filter((item) => item.ready && !item.served);
  if (readyUnserved.length === 0) {
    throw new HttpError(400, "No ready items to mark served");
  }

  await prisma.orderItem.updateMany({
    where: { id: { in: readyUnserved.map((item) => item.id) } },
    data: { served: true },
  });

  const completed = await tryAutoCompleteOrder(orderId, staffId);
  if (completed) {
    res.json(completed);
    return;
  }

  emitOrdersChanged();
  const updated = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
  res.json(updated);
}

export async function setOrderItemTakeout(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const { isTakeout } = setTakeoutSchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.orderType !== "DINE_IN") {
    throw new HttpError(409, "Only items on a Dine In order can be flagged as takeout");
  }

  const orderItem = await prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
  if (!orderItem) throw new HttpError(404, "Order item not found");
  if (orderItem.orderComboId !== null) {
    throw new HttpError(409, "This item is part of a combo — flag the whole combo as takeout instead");
  }
  assertItemMutable(order.status, orderItem.ready || orderItem.served);

  await prisma.orderItem.update({ where: { id: itemId }, data: { isTakeout } });

  emitOrdersChanged();
  const updated = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
  res.json(updated);
}

// Add a combo bundle to an order — one component OrderItem per filled slot,
// priced at $0 individually since the combo's own price (discount applied to
// the sum of the selected items) covers the bundle.
export async function addOrderCombo(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const { comboId, selections } = addComboSchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");
  assertItemsAddable(order.status);

  const combo = await prisma.combo.findUnique({ where: { id: comboId }, include: { slots: true } });
  if (!combo || !combo.isActive) throw new HttpError(400, "Combo is not available");

  const seenSlots = new Set(selections.map((s) => s.slotId));
  if (seenSlots.size !== combo.slots.length || selections.length !== combo.slots.length) {
    throw new HttpError(400, "Each combo slot must be filled exactly once");
  }

  const slotById = new Map(combo.slots.map((s) => [s.id, s]));
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: selections.map((s) => s.menuItemId) } },
  });
  const menuItemById = new Map(menuItems.map((mi) => [mi.id, mi]));

  for (const selection of selections) {
    const slot = slotById.get(selection.slotId);
    if (!slot) throw new HttpError(400, `Slot ${selection.slotId} does not belong to this combo`);
    const menuItem = menuItemById.get(selection.menuItemId);
    if (!menuItem || !menuItem.isActive) throw new HttpError(400, "Selected item is not available");
    if (menuItem.categoryId !== slot.categoryId) {
      throw new HttpError(400, `${menuItem.name} does not belong to the required category for this slot`);
    }
  }

  // The discount applies to the sum of the items actually picked for each
  // slot — not an abstract category estimate — so a customer who picks the
  // cheapest options gets a cheaper combo than one who picks the priciest.
  const selectionSubtotal = selections.reduce(
    (sum, selection) => sum + menuItemById.get(selection.menuItemId)!.price,
    0
  );
  const comboPrice = applyComboDiscount(selectionSubtotal, combo.discountPercent);

  const updated = await prisma.$transaction(async (tx) => {
    const orderCombo = await tx.orderCombo.create({
      data: {
        orderId,
        comboId: combo.id,
        nameSnap: combo.name,
        priceSnap: comboPrice,
        round: order.currentRound,
      },
    });
    for (const selection of selections) {
      const menuItem = menuItemById.get(selection.menuItemId)!;
      await tx.orderItem.create({
        data: {
          orderId,
          menuItemId: menuItem.id,
          nameSnap: menuItem.name,
          unitPriceSnap: 0,
          quantity: 1,
          lineTotal: 0,
          round: order.currentRound,
          orderComboId: orderCombo.id,
        },
      });
    }
    return recomputeOrderTotal(tx, orderId);
  });

  emitOrdersChanged();
  res.status(201).json(updated);
}

export async function removeOrderCombo(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const comboInstanceId = Number(req.params.comboInstanceId);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");

  const orderCombo = await prisma.orderCombo.findFirst({
    where: { id: comboInstanceId, orderId },
    include: { items: true },
  });
  if (!orderCombo) throw new HttpError(404, "Combo not found on this order");

  const locked = orderCombo.items.some((item) => item.ready || item.served);
  assertItemMutable(order.status, locked);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.orderCombo.delete({ where: { id: comboInstanceId } });
    return recomputeOrderTotal(tx, orderId);
  });

  emitOrdersChanged();
  res.json(updated);
}

export async function setOrderComboTakeout(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const comboInstanceId = Number(req.params.comboInstanceId);
  const { isTakeout } = setComboTakeoutSchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.orderType !== "DINE_IN") {
    throw new HttpError(409, "Only combos on a Dine In order can be flagged as takeout");
  }

  const orderCombo = await prisma.orderCombo.findFirst({
    where: { id: comboInstanceId, orderId },
    include: { items: true },
  });
  if (!orderCombo) throw new HttpError(404, "Combo not found on this order");

  const locked = orderCombo.items.some((item) => item.ready || item.served);
  assertItemMutable(order.status, locked);

  await prisma.orderCombo.update({ where: { id: comboInstanceId }, data: { isTakeout } });

  emitOrdersChanged();
  const updated = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
  res.json(updated);
}

// Any active staff member can apply this — in practice the server just
// checks the presented ID, no manager override required. Blocked once the
// order is closed out (paid or cancelled) since the receipt is already final.
export async function setOrderDiscount(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const { discountType, idNumber, name } = setDiscountSchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.status === "PAYMENT_FULFILLED" || order.status === "CANCELLED") {
    throw new HttpError(409, "Cannot change the discount on a closed order");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        discountType,
        discountIdNumber: discountType ? idNumber : null,
        discountName: discountType ? name : null,
      },
    });
    return recomputeOrderTotal(tx, orderId);
  });

  emitOrdersChanged();
  res.json(updated);
}

export async function submitOrder(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const { staffId } = transitionBodySchema.parse(req.body);

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.items.length === 0) throw new HttpError(400, "Cannot submit an order with no items");

  const updated = await transitionOrder(orderId, "SEATED", "PREPARING", staffId);
  res.json(updated);
}

export async function cancelOrder(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const { staffId } = transitionBodySchema.parse(req.body);
  const updated = await transitionOrder(orderId, "SEATED", "CANCELLED", staffId);
  res.json(updated);
}

export async function reopenOrder(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const { staffId } = transitionBodySchema.parse(req.body);
  const updated = await transitionOrder(orderId, "SERVED", "PREPARING", staffId);
  res.json(updated);
}

export async function requestPayment(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const { staffId } = transitionBodySchema.parse(req.body);
  const updated = await transitionOrder(orderId, "SERVED", "PAYMENT_PENDING", staffId);
  res.json(updated);
}

export async function completePayment(req: Request, res: Response) {
  const orderId = Number(req.params.id);
  const { staffId } = transitionBodySchema.parse(req.body);
  const updated = await transitionOrder(orderId, "PAYMENT_PENDING", "PAYMENT_FULFILLED", staffId);
  res.json(updated);
}
