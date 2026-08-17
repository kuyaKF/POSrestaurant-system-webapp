export type StaffRole = "MANAGER" | "SERVER" | "KITCHEN";

export interface Staff {
  id: number;
  name: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

export interface TableActiveOrderRef {
  id: number;
  status: OrderStatus;
}

export interface Table {
  id: number;
  number: number;
  capacity: number;
  isOccupied: boolean;
  createdAt: string;
  orders: TableActiveOrderRef[];
}

export interface Category {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  category: Category;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComboSlot {
  id: number;
  comboId: number;
  categoryId: number;
  category: Category;
  sortOrder: number;
}

export interface Combo {
  id: number;
  name: string;
  // The discount applies to the sum of whichever specific items fill its
  // slots at order time, so there's no single fixed price for the combo
  // itself — only for a particular selection (see OrderCombo.priceSnap).
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  slots: ComboSlot[];
}

export type OrderStatus = "SEATED" | "PREPARING" | "SERVED" | "PAYMENT_PENDING" | "PAYMENT_FULFILLED";

export type OrderType = "DINE_IN" | "TAKEOUT";

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  nameSnap: string;
  unitPriceSnap: number;
  quantity: number;
  lineTotal: number;
  ready: boolean;
  served: boolean;
  isTakeout: boolean;
  round: number;
  orderComboId: number | null;
  createdAt: string;
}

export interface OrderCombo {
  id: number;
  orderId: number;
  comboId: number;
  nameSnap: string;
  priceSnap: number;
  isTakeout: boolean;
  round: number;
  createdAt: string;
}

export interface OrderStatusLog {
  id: number;
  orderId: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedById: number;
  changedBy: Staff;
  changedAt: string;
}

export interface Order {
  id: number;
  tableId: number | null;
  table: Table | null;
  orderType: OrderType;
  partySize: number;
  serverId: number;
  server: Staff;
  status: OrderStatus;
  total: number;
  currentRound: number;
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
  items: OrderItem[];
  combos: OrderCombo[];
  statusLogs: OrderStatusLog[];
}
