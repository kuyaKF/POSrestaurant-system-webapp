import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { getTable, listTables } from "../controllers/tables.controller";

export const tablesRouter = Router();

tablesRouter.get("/", asyncHandler(listTables));
tablesRouter.get("/:id", asyncHandler(getTable));
