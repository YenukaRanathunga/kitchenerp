import { createHmac, timingSafeEqual } from "node:crypto";

export const sessionCookie = "office_stock_session";

export function accessPassword() {
  return process.env.OFFICE_STOCK_PASSWORD || "";
}

export function matchesPassword(candidate: string) {
  const expected = Buffer.from(accessPassword());
  const actual = Buffer.from(candidate);
  return expected.length > 0 && actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function sessionValue() {
  return createHmac("sha256", accessPassword()).update("office-stock-session-v1").digest("hex");
}

export function validSession(candidate: string | undefined) {
  if (!accessPassword() || !candidate) return false;
  const expected = Buffer.from(sessionValue());
  const actual = Buffer.from(candidate);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
