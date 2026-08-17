import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { listStaff } from "../controllers/staff.controller";

export const staffRouter = Router();

staffRouter.get("/", asyncHandler(listStaff));
