// modules/auth/jwt.ts
import { UnauthorizedException } from "@nestjs/common";
import { sign, verify, SignOptions } from "jsonwebtoken";
import { secretConfig } from "config/secret.config";
import { DecodedToken } from "modules/auth/auth.types";
import { ERROR_MESSAGES } from "constants/messages.constants";

export function generateAccessToken(payload: object): string {
  return sign(payload, secretConfig.accessSecretKey, {
    expiresIn: secretConfig.accessTokenExpiry as SignOptions["expiresIn"],
  });
}

export function generateRefreshToken(payload: object): string {
  return sign(payload, secretConfig.refreshSecretKey, {
    expiresIn: secretConfig.refreshTokenExpiry as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): DecodedToken {
  try {
    return verify(token, secretConfig.accessSecretKey) as DecodedToken;
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
  }
}

export function verifyRefreshToken(token: string): DecodedToken {
  try {
    return verify(token, secretConfig.refreshSecretKey) as DecodedToken;
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
  }
}
