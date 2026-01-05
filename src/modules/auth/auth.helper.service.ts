import { JwtPayload, sign, verify } from "jsonwebtoken";
import { UnauthorizedException } from "@nestjs/common/exceptions";
import { secretConfig } from "src/config/secret.config";
import { AES, enc } from "crypto-js";
import { ERROR_MESSAGES } from "src/constants/messages.constants";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthHelperService {
  generateAccessToken(payload: object, expiresIn = secretConfig.jwtExpirationTime): string {
    return sign(payload, secretConfig.accessSecretKey, {}, expiresIn);
  }
  generateRefreshToken(payload: object, expiresIn = secretConfig.jwtExpirationTime): string {
    return sign(payload, secretConfig.refreshSecretKey, {}, expiresIn);
  }

  verifyToken(token: string): JwtPayload {
    try {
      return <JwtPayload>verify(token, secretConfig.jwtSecretKey);
    } catch (e) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return <JwtPayload>verify(token, secretConfig.accessSecretKey);
    } catch (e) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }
  verifyRefreshToken(token: string): JwtPayload {
    try {
      return <JwtPayload>verify(token, secretConfig.refreshSecretKey);
    } catch (e) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }

  decodeToken(authToken: string): { id: string } {
    if (!authToken) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = this.verifyToken(authToken);

    return { id };
  }
  validateGuardRequest(authToken: string): { id: string } {
    const data = this.decodeToken(authToken);

    return data;
  }
}
