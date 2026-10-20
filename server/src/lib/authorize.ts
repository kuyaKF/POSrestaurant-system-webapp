import { StaffRole } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../middleware/errorHandler";

export async function requireStaffWithRole(staffId: number, allowedRoles: StaffRole[]) {
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.isActive) throw new HttpError(400, "Invalid or inactive staff member");
  if (!allowedRoles.includes(staff.role)) {
    throw new HttpError(403, "You don't have permission to perform this action");
  }
  return staff;
}
