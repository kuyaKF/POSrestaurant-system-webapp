import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import {
  createMenuItem,
  deleteMenuItem,
  listMenuItems,
  updateMenuItem,
} from "../controllers/menuItems.controller";

export const menuItemsRouter = Router();

menuItemsRouter.get("/", asyncHandler(listMenuItems));
menuItemsRouter.post("/", asyncHandler(createMenuItem));
menuItemsRouter.patch("/:id", asyncHandler(updateMenuItem));
menuItemsRouter.delete("/:id", asyncHandler(deleteMenuItem));
