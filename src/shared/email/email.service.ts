import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { secretConfig } from "config/secret.config";
import { DURATION_CONSTANTS } from "constants/duration";
import { ERROR_MESSAGES } from "constants/messages";
import { logger } from "services/logger.service";
import { generateEmailToken, verifyEmailToken } from "utils/jwt";
import { RedisService } from "../redis/redis.service";

const {
  emailConfigs: { senderEmail, senderName },
  serverConfigs: { baseUrl },
} = secretConfig;
/**
 * Provides automated email communication and secure account verification workflows.
 *
 * @remarks
 * This service integrates with an SMTP transport (Nodemailer) and {@link RedisService}
 * to manage the lifecycle of verification tokens. It ensures that account security
 * actions are cryptographically signed and statefully tracked for single-use validation.
 *
 * @group Identity & Access Services
 */
@Injectable()
export class EmailService {
  constructor(
    private readonly redisService: RedisService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Generates a signed JWT specific to email verification.
   *
   * @param userId - The ID of the user requesting verification.
   * @returns A cryptographically signed token string.
   */
  private generateVerificationToken(userId: string): string {
    return generateEmailToken({ userId, type: "email_verification" });
  }

  /**
   * Orchestrates the delivery of a verification email and stores the session in Redis.
   *
   * @param email - Recipient's email address.
   * @param userId - Associated user identifier.
   * @param name - Optional display name for email personalization.
   * @returns A promise that resolves when the email is successfully handed off to the SMTP server.
   * @throws InternalServerErrorException if the SMTP transport fails or Redis is unreachable.
   */
  async sendVerificationEmail(email: string, userId: string, name?: string): Promise<void> {
    try {
      const token = this.generateVerificationToken(userId);
      const redisKey = `verification:${userId}`;
      await this.redisService.set(redisKey, token, DURATION_CONSTANTS.ONE_DAY_IN_SEC);

      const verificationLink = `${baseUrl}/auth/verify-email?token=${token}`;

      // Send email using Transporter
      await this.mailerService.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: email,
        subject: "Verify Your Email Address",
        text: `Hello ${name || "User"},\n\nPlease verify your email: ${verificationLink}`,
        html: this.getVerificationEmailTemplate(name || "User", verificationLink),
      });
    } catch (error) {
      logger.error("Email Service Failure Details: %o", error);
      throw new InternalServerErrorException(ERROR_MESSAGES.EMAIL_VERIFICATION_FAILED);
    }
  }

  /**
   * Validates a verification token against both JWT signature and Redis existence.
   *
   * @param token - The token string provided via the email link.
   * @returns The user's ID if verification is successful; otherwise, null.
   * @remarks
   * This method follows a "consume-on-success" pattern, deleting the token from
   * Redis once validated to prevent reuse.
   */
  async verifyEmail(token: string) {
    try {
      const decoded = verifyEmailToken(token) as { userId: string; type: string };

      if (decoded.type !== "email_verification") {
        return null;
      }

      // Check if token exists in Redis
      const redisKey = `verification:${decoded.userId}`;
      const storedToken = await this.redisService.get(redisKey);

      if (!storedToken || storedToken !== token) {
        return null;
      }

      // Delete token from Redis after verification
      await this.redisService.delete([redisKey]);

      return decoded.userId;
    } catch {
      return null;
    }
  }

  /**
   * Revokes existing verification sessions and initiates a fresh verification workflow.
   *
   * @param email - Recipient's email address.
   * @param userId - User identifier.
   * @param name - Optional display name.
   * @returns A promise that resolves when the new email is sent.
   */
  async resendVerificationEmail(email: string, userId: string, name?: string): Promise<void> {
    // Delete old token if exists
    const redisKey = `verification:${userId}`;
    await this.redisService.delete([redisKey]);

    // Send new verification email
    await this.sendVerificationEmail(email, userId, name);
  }

  /**
   * Generates a responsive HTML template for account verification.
   *
   * @param name - User's name for personalization.
   * @param verificationLink - The absolute URL for the verification endpoint.
   * @returns A string containing the full HTML document.
   */
  private getVerificationEmailTemplate(name: string, verificationLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333;">Hello ${name}!</h2>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationLink}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This link will expire in 24 hours. If you did not create an account, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
