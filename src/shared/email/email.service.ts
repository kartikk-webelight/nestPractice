import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { secretConfig } from "config/secret.config";
import { CACHE_PREFIX } from "constants/cache-prefixes";
import { DURATION_CONSTANTS } from "constants/duration";
import { ERROR_MESSAGES } from "constants/messages";
import { EmailType } from "enums";
import { logger } from "services/logger.service";
import { getCacheKey } from "utils/cache";
import { generateEmailToken, verifyEmailToken } from "utils/jwt";
import { CacheService } from "../cache/cache.service";

const {
  emailConfigs: { senderEmail, senderName },
  serverConfigs: { baseUrl },
} = secretConfig;
/**
 * Provides automated email communication and secure account verification workflows.
 *
 * @remarks
 * This service integrates with an SMTP transport (Nodemailer) and {@link CacheService}
 * to manage the lifecycle of verification tokens. It ensures that account security
 * actions are cryptographically signed and statefully tracked for single-use validation.
 *
 * @group Identity & Access Services
 */
@Injectable()
export class EmailService {
  constructor(
    private readonly cacheService: CacheService,
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
   * Sends a system email based on the specified type.
   * @param email - Recipient's email address.
   * @param name - Recipient's name for personalization.
   * @param emailType - The category of email to send (VERIFICATION, DELETION, etc.).
   * @param data - Optional object containing dynamic links or tokens (e.g., verificationLink).
   */
  async sendEmail(email: string, name: string, emailType: EmailType, data?: { link: string }) {
    const userName = name || "User";

    // Define which template and subject to use per EmailType
    const emailMap = {
      [EmailType.VERIFICATION]: {
        template: "verification", // Matches verification.hbs
        subject: "Verify Your Email Address",
      },
      [EmailType.ACCOUNT_DEACTIVATED]: {
        template: "deactivation", // Matches deactivation.hbs
        subject: "Account Deactivated",
      },
    };

    const config = emailMap[emailType];
    if (!config) throw new Error(`Email type ${emailType} not supported`);

    await this.mailerService.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: email,
      subject: config.subject,
      template: config.template,
      context: {
        // Data for the {{variables}} in .hbs
        name: userName,
        link: data?.link,
      },
    });

    logger.info("Email sent: %s to %s", emailType, email);
  }

  /**
   * Orchestrates the delivery of a verification email and stores the session in Redis cache.
   *
   * @param email - Recipient's email address.
   * @param userId - Associated user identifier.
   * @param name - Optional display name for email personalization.
   * @returns A promise that resolves when the email is successfully handed off to the SMTP server.
   * @throws InternalServerErrorException if the SMTP transport fails or Redis cache is unreachable.
   */
  async sendVerificationEmail(email: string, userId: string, name: string): Promise<void> {
    try {
      const token = this.generateVerificationToken(userId);
      const cacheKey = getCacheKey(CACHE_PREFIX.VERIFICATION, userId);
      await this.cacheService.set(cacheKey, token, DURATION_CONSTANTS.ONE_DAY_IN_SEC);

      const verificationLink = `${baseUrl}/auth/verify-email?token=${token}`;

      // Send email using Transporter
      await this.sendEmail(email, name, EmailType.VERIFICATION, { link: verificationLink });
    } catch (error) {
      logger.error("Email Service Failure Details: %o", error);
      throw new InternalServerErrorException(ERROR_MESSAGES.EMAIL_VERIFICATION_FAILED);
    }
  }

  /**
   * Sends an account deactivation notice with details on the 30-day grace period.
   *
   * @param email - Recipient's email address.
   * @param name - User's name for personalization.
   * @returns A promise that resolves when the deactivation notice is successfully dispatched.
   * @throws InternalServerErrorException if the email dispatch fails.
   */
  async sendAccountDeactivationEmail(email: string, name: string): Promise<void> {
    try {
      await this.sendEmail(email, name, EmailType.ACCOUNT_DEACTIVATED);
    } catch (error) {
      logger.error("Email Service Failure Details: %o", error);
      throw new InternalServerErrorException(ERROR_MESSAGES.ACCOUNT_DEACTIVATION_EMAIL_FAILED);
    }
  }

  /**
   * Validates a verification token against both JWT signature and Redis cache existence.
   *
   * @param token - The token string provided via the email link.
   * @returns The user's ID if verification is successful; otherwise, null.
   * @remarks
   * This method follows a "consume-on-success" pattern, deleting the token from
   * Redis cache once validated to prevent reuse.
   */
  async verifyEmail(token: string) {
    try {
      const decoded = verifyEmailToken(token) as { userId: string; type: string };

      if (decoded.type !== "email_verification") {
        return null;
      }

      // Check if token exists in Redis cache
      const cacheKey = getCacheKey(CACHE_PREFIX.VERIFICATION, decoded.userId);
      const storedToken = await this.cacheService.get(cacheKey);

      if (!storedToken || storedToken !== token) {
        return null;
      }

      // Delete token from Redis cache after verification
      await this.cacheService.delete([cacheKey]);

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
  async resendVerificationEmail(email: string, userId: string, name: string): Promise<void> {
    // Delete old token if exists
    const cacheKey = getCacheKey(CACHE_PREFIX.VERIFICATION, userId);
    await this.cacheService.delete([cacheKey]);

    // Send new verification email
    await this.sendVerificationEmail(email, userId, name);
  }
}
