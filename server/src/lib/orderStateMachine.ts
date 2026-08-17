import { OrderStatus } from "@prisma/client";
import { HttpError } from "../middleware/errorHandler";

// SERVED can go forward to PAYMENT_PENDING, or back to PREPARING when the
// table orders an additional round before asking for the bill.
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  SEATED: ["PREPARING"],
  PREPARING: ["SERVED"],
  SERVED: ["PREPARING", "PAYMENT_PENDING"],
  PAYMENT_PENDING: ["PAYMENT_FULFILLED"],
  PAYMENT_FULFILLED: [],
};

export function assertTransition(current: OrderStatus, expectedFrom: OrderStatus, to: OrderStatus) {
  if (current !== expectedFrom) {
    throw new HttpError(409, `Order is in status ${current}, expected ${expectedFrom} to move to ${to}`);
  }
  if (!ORDER_TRANSITIONS[current].includes(to)) {
    throw new HttpError(409, `Cannot move an order from ${current} to ${to}`);
  }
}

const ITEM_ADDABLE_STATUSES: OrderStatus[] = ["SEATED", "PREPARING"];

export function assertItemsAddable(status: OrderStatus) {
  if (!ITEM_ADDABLE_STATUSES.includes(status)) {
    throw new HttpError(409, "Items can only be added while the order is SEATED or PREPARING");
  }
}

export function assertItemMutable(status: OrderStatus, itemLocked: boolean) {
  if (status === "SEATED") return;
  if (status === "PREPARING" && !itemLocked) return;
  if (status === "PREPARING" && itemLocked) {
    throw new HttpError(409, "This item is already being prepared or served and cannot be changed");
  }
  throw new HttpError(409, "Items can only be modified while the order is SEATED or PREPARING");
}

export function assertOrderPreparing(status: OrderStatus) {
  if (status !== "PREPARING") {
    throw new HttpError(409, "Items can only be updated while the order is PREPARING");
  }
}
