import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import {
  addOrderCombo,
  addOrderItem,
  cancelOrder,
  completePayment,
  createOrder,
  getOrder,
  listOrders,
  removeOrderCombo,
  removeOrderItem,
  reopenOrder,
  requestPayment,
  serveReadyItems,
  setOrderComboTakeout,
  setOrderDiscount,
  setOrderItemNotes,
  setOrderItemReady,
  setOrderItemServed,
  setOrderItemTakeout,
  submitOrder,
  updateOrderItem,
} from "../controllers/orders.controller";

export const ordersRouter = Router();

ordersRouter.get("/", asyncHandler(listOrders));
ordersRouter.get("/:id", asyncHandler(getOrder));
ordersRouter.post("/", asyncHandler(createOrder));
ordersRouter.post("/:id/items", asyncHandler(addOrderItem));
ordersRouter.patch("/:id/items/:itemId", asyncHandler(updateOrderItem));
ordersRouter.delete("/:id/items/:itemId", asyncHandler(removeOrderItem));
ordersRouter.patch("/:id/items/:itemId/ready", asyncHandler(setOrderItemReady));
ordersRouter.patch("/:id/items/:itemId/served", asyncHandler(setOrderItemServed));
ordersRouter.patch("/:id/items/:itemId/takeout", asyncHandler(setOrderItemTakeout));
ordersRouter.patch("/:id/items/:itemId/notes", asyncHandler(setOrderItemNotes));
ordersRouter.post("/:id/combos", asyncHandler(addOrderCombo));
ordersRouter.delete("/:id/combos/:comboInstanceId", asyncHandler(removeOrderCombo));
ordersRouter.patch("/:id/combos/:comboInstanceId/takeout", asyncHandler(setOrderComboTakeout));
ordersRouter.patch("/:id/discount", asyncHandler(setOrderDiscount));
ordersRouter.post("/:id/submit", asyncHandler(submitOrder));
ordersRouter.post("/:id/cancel", asyncHandler(cancelOrder));
ordersRouter.post("/:id/serve-ready-items", asyncHandler(serveReadyItems));
ordersRouter.post("/:id/reopen", asyncHandler(reopenOrder));
ordersRouter.post("/:id/request-payment", asyncHandler(requestPayment));
ordersRouter.post("/:id/complete-payment", asyncHandler(completePayment));
