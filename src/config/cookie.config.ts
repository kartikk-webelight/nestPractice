import { CookieOptions } from "express";
import { DURATION_CONSTANTS } from "constants/duration.constants";

export const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: DURATION_CONSTANTS.ONE_HOUR_IN_MS,
};

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/v1/auth/refresh-token",
  maxAge: DURATION_CONSTANTS.ONE_DAY_IN_MS,
};
