import { EventEmitter } from "events";

export const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(50);

export function emitOrdersChanged() {
  orderEvents.emit("changed");
}
