import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { uploadMenuItemImageMiddleware } from "../middleware/upload";
import {
  createMenuItem,
  deleteMenuItem,
  deleteMenuItemImage,
  listMenuItems,
  updateMenuItem,
  uploadMenuItemImage,
} from "../controllers/menuItems.controller";

export const menuItemsRouter = Router();

menuItemsRouter.get("/", asyncHandler(listMenuItems));
menuItemsRouter.post("/", asyncHandler(createMenuItem));
menuItemsRouter.patch("/:id", asyncHandler(updateMenuItem));
menuItemsRouter.delete("/:id", asyncHandler(deleteMenuItem));
menuItemsRouter.post("/:id/image", uploadMenuItemImageMiddleware, asyncHandler(uploadMenuItemImage));
menuItemsRouter.delete("/:id/image", asyncHandler(deleteMenuItemImage));
