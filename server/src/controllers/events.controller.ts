import { Request, Response } from "express";
import { orderEvents } from "../lib/orderEvents";

export function streamOrderEvents(req: Request, res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("retry: 2000\n\n");

  const send = () => {
    res.write("data: orders-changed\n\n");
  };

  orderEvents.on("changed", send);

  const heartbeat = setInterval(() => {
    res.write(":heartbeat\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    orderEvents.off("changed", send);
    res.end();
  });
}
