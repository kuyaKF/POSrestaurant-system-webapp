import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { listStaff, loginStaff } from "../controllers/staff.controller";

export const staffRouter = Router();

staffRouter.get("/", asyncHandler(listStaff));
staffRouter.post("/:id/login", asyncHandler(loginStaff));
