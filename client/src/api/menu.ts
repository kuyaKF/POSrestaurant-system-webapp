import { apiGet, apiSend, apiUpload } from "./client";
import { Category, MenuItem } from "../types";

export function fetchCategories(): Promise<Category[]> {
  return apiGet<Category[]>("/api/categories");
}

export function fetchMenuItems(opts?: { activeOnly?: boolean }): Promise<MenuItem[]> {
  const query = opts?.activeOnly === false ? "?activeOnly=false" : "";
  return apiGet<MenuItem[]>(`/api/menu-items${query}`);
}

export interface MenuItemInput {
  name: string;
  price: number;
  categoryId: number;
}

export function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  return apiSend<MenuItem>("/api/menu-items", "POST", input);
}

export function updateMenuItem(id: number, input: Partial<MenuItemInput> & { isActive?: boolean }): Promise<MenuItem> {
  return apiSend<MenuItem>(`/api/menu-items/${id}`, "PATCH", input);
}

export function deleteMenuItem(id: number): Promise<void> {
  return apiSend<void>(`/api/menu-items/${id}`, "DELETE");
}

export function uploadMenuItemImage(id: number, file: File): Promise<MenuItem> {
  const formData = new FormData();
  formData.append("image", file);
  return apiUpload<MenuItem>(`/api/menu-items/${id}/image`, formData);
}

export function deleteMenuItemImage(id: number): Promise<MenuItem> {
  return apiSend<MenuItem>(`/api/menu-items/${id}/image`, "DELETE");
}
