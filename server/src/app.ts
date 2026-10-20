import express from "express";
import cors from "cors";
import { env } from "./env";
import { uploadsRootDir } from "./middleware/upload";
import { tablesRouter } from "./routes/tables.routes";
import { staffRouter } from "./routes/staff.routes";
import { categoriesRouter } from "./routes/categories.routes";
import { menuItemsRouter } from "./routes/menuItems.routes";
import { combosRouter } from "./routes/combos.routes";
import { ordersRouter } from "./routes/orders.routes";
import { eventsRouter } from "./routes/events.routes";
import { reportsRouter } from "./routes/reports.routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json());
app.use("/uploads", express.static(uploadsRootDir));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/tables", tablesRouter);
app.use("/api/staff", staffRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/menu-items", menuItemsRouter);
app.use("/api/combos", combosRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/events", eventsRouter);
app.use("/api/reports", reportsRouter);

app.use(notFound);
app.use(errorHandler);
