import { Injectable } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common/exceptions";
import { sign, SignOptions, verify } from "jsonwebtoken";
import { secretConfig } from "config/secret.config";
import { ERROR_MESSAGES } from "constants/messages.constants";
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

  verifyAccessToken(token: string): DecodedToken {
    try {
      const decoded = verify(token, secretConfig.accessSecretKey);

      return decoded as DecodedToken;
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }
  verifyRefreshToken(token: string): DecodedToken {
    try {
      const decoded = verify(token, secretConfig.refreshSecretKey);

      return decoded as DecodedToken;
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }
}
