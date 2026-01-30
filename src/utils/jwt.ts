// modules/auth/jwt.ts
import { UnauthorizedException } from "@nestjs/common";
import { sign, verify, SignOptions } from "jsonwebtoken";
import { secretConfig } from "config/secret.config";
import { DecodedToken } from "modules/auth/auth.types";
import { ERROR_MESSAGES } from "constants/messages";

const {
  authConfigs: {
    accessSecretKey,
    accessTokenExpiry,
    refreshSecretKey,
    refreshTokenExpiry,
    emailVerificationSecretKey,
    emailTokenExpiry,
  },
} = secretConfig;
/**
 * Generate a JWT access token
 */
export const generateAccessToken = (payload: object): string =>
  sign(payload, accessSecretKey, {
    expiresIn: accessTokenExpiry as SignOptions["expiresIn"],
  });

/**
 * Generate a JWT refresh token
 */
export const generateRefreshToken = (payload: object): string =>
  sign(payload, refreshSecretKey, {
    expiresIn: refreshTokenExpiry as SignOptions["expiresIn"],
  });

export const generateEmailToken = (payload: object): string =>
  sign(payload, emailVerificationSecretKey, {
    expiresIn: emailTokenExpiry as SignOptions["expiresIn"],
  });

/**
 * Verify an access token and return decoded payload
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    return verify(token, accessSecretKey) as DecodedToken;
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
  }
};

/**
 * Verify a refresh token and return decoded payload
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    return verify(token, refreshSecretKey) as DecodedToken;
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
  }
};
export const verifyEmailToken = (token: string) => {
  try {
    return verify(token, emailVerificationSecretKey);
  } catch {
    throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
  }
};
