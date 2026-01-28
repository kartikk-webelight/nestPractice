import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as nodemailer from "nodemailer"; // Import nodemailer
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { secretConfig } from "config/secret.config";
import { DURATION_CONSTANTS } from "constants/duration";
import { ERROR_MESSAGES } from "constants/messages";
import { generateEmailToken, verifyEmailToken } from "utils/jwt";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly redisService: RedisService) {
    this.transporter = nodemailer.createTransport({
      host: secretConfig.mailtrapConfigs.host,
      port: Number(secretConfig.mailtrapConfigs.port),
      auth: {
        user: secretConfig.mailtrapConfigs.sandboxUsername,
        pass: secretConfig.mailtrapConfigs.sandboxPassword,
      },
    } as SMTPTransport.Options);
  }

  /**
   * Generate verification token for email verification
   */
  private generateVerificationToken(userId: string): string {
    return generateEmailToken({ userId, type: "email_verification" });
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(email: string, userId: string, name?: string): Promise<void> {
    try {
      const token = this.generateVerificationToken(userId);
      const redisKey = `verification:${userId}`;
      await this.redisService.set(redisKey, token, DURATION_CONSTANTS.ONE_DAY_IN_SEC);

      const verificationLink = `${secretConfig.apiBaseUrl}/auth/verify-email?token=${token}`;

      // Send email using Transporter
      await this.transporter.sendMail({
        from: `"${secretConfig.senderName}" <${secretConfig.senderEmail}>`,
        to: email,
        subject: "Verify Your Email Address",
        text: `Hello ${name || "User"},\n\nPlease verify your email: ${verificationLink}`,
        html: this.getVerificationEmailTemplate(name || "User", verificationLink),
      });
    } catch {
      throw new InternalServerErrorException(ERROR_MESSAGES.EMAIL_VERIFICATION_FAILED);
    }
  }

  /**
   * Verify email token from Redis
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
   * Resend verification email
   */
  async resendVerificationEmail(email: string, userId: string, name?: string): Promise<void> {
    // Delete old token if exists
    const redisKey = `verification:${userId}`;
    await this.redisService.delete([redisKey]);

    // Send new verification email
    await this.sendVerificationEmail(email, userId, name);
  }

  /**
   * Get HTML email template for verification
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
