import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { listCategories } from "../controllers/categories.controller";

export const categoriesRouter = Router();

categoriesRouter.get("/", asyncHandler(listCategories));
