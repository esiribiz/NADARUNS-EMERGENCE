import { storage } from "./utils/storage";

const KEY = "@nadaruns/role";

export type Role = "driver" | "business";

export async function getRole(): Promise<Role | null> {
  const v = await storage.getItem(KEY, "");
  return v === "driver" || v === "business" ? v : null;
}

export async function setRole(role: Role): Promise<void> {
  await storage.setItem(KEY, role);
}

export async function clearRole(): Promise<void> {
  await storage.removeItem(KEY);
}
