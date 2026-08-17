import { Router } from "express";
import { streamOrderEvents } from "../controllers/events.controller";

export const eventsRouter = Router();

eventsRouter.get("/", streamOrderEvents);
