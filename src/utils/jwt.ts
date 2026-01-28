// modules/auth/jwt.ts
import { UnauthorizedException } from "@nestjs/common";
import { sign, verify, SignOptions } from "jsonwebtoken";
import { secretConfig } from "config/secret.config";
import { DecodedToken } from "modules/auth/auth.types";
import { ERROR_MESSAGES } from "constants/messages";

/**
 * Generate a JWT access token
 */
export const generateAccessToken = (payload: object): string =>
  sign(payload, secretConfig.accessSecretKey, {
    expiresIn: secretConfig.accessTokenExpiry as SignOptions["expiresIn"],
  });

/**
 * Generate a JWT refresh token
 */
export const generateRefreshToken = (payload: object): string =>
  sign(payload, secretConfig.refreshSecretKey, {
    expiresIn: secretConfig.refreshTokenExpiry as SignOptions["expiresIn"],
  });

export const generateEmailToken = (payload: object): string =>
  sign(payload, secretConfig.emailVerificationSecretKey, {
    expiresIn: secretConfig.emailTokenExpiry as SignOptions["expiresIn"],
  });

/**
 * Verify an access token and return decoded payload
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    return verify(token, secretConfig.accessSecretKey) as DecodedToken;
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
  }
};

/**
 * Verify a refresh token and return decoded payload
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    return verify(token, secretConfig.refreshSecretKey) as DecodedToken;
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
  }
};
export const verifyEmailToken = (token: string) => {
  try {
    return verify(token, secretConfig.emailVerificationSecretKey);
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
  }
};
