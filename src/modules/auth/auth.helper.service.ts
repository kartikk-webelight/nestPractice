import { Injectable } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common/exceptions";
import { secretConfig } from "config/secret.config";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { JwtPayload, sign, SignOptions, verify } from "jsonwebtoken";

import { DecodedToken } from "./auth.types";

@Injectable()
export class AuthHelperService {
  generateAccessToken(payload: object): string {
    return sign(payload, secretConfig.accessSecretKey, {
      expiresIn: secretConfig.accessTokenExpiry as SignOptions["expiresIn"],
    });
  }
  generateRefreshToken(payload: object): string {
    return sign(payload, secretConfig.refreshSecretKey, {
      expiresIn: secretConfig.refreshTokenExpiry as SignOptions["expiresIn"],
    });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return verify(token, secretConfig.jwtSecretKey) as JwtPayload;
    } catch (e) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }

  verifyAccessToken(token: string): DecodedToken {
    try {
      const decoded = verify(token, secretConfig.accessSecretKey);

      if (typeof decoded === "string" || !("id" in decoded)) {
        throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
      }

      return decoded as DecodedToken;
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }
  verifyRefreshToken(token: string): DecodedToken {
    try {
      const decoded = verify(token, secretConfig.refreshSecretKey);

      if (typeof decoded === "string" || !("id" in decoded)) {
        throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
      }

      return decoded as DecodedToken;
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }
}
