import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { getXReading, listReadings, postZReading } from "../controllers/reports.controller";

export const reportsRouter = Router();

reportsRouter.get("/x-reading", asyncHandler(getXReading));
reportsRouter.post("/z-reading", asyncHandler(postZReading));
reportsRouter.get("/readings", asyncHandler(listReadings));
