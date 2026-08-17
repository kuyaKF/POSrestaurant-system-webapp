import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { createCombo, deleteCombo, listCombos, updateCombo } from "../controllers/combos.controller";

export const combosRouter = Router();

combosRouter.get("/", asyncHandler(listCombos));
combosRouter.post("/", asyncHandler(createCombo));
combosRouter.patch("/:id", asyncHandler(updateCombo));
combosRouter.delete("/:id", asyncHandler(deleteCombo));
