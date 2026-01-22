import { Injectable } from "@nestjs/common";
import { sign, SignOptions, verify } from "jsonwebtoken";
import { MailtrapClient } from "mailtrap";
import { secretConfig } from "config/secret.config";
import { RedisService } from "../redis/redis.service";

const client = new MailtrapClient({
  token: secretConfig.mailtrapApiKey,
});

@Injectable()
export class EmailService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Generate verification token for email verification
   */
  private generateVerificationToken(userId: string): string {
    return sign({ userId, type: "email_verification" }, secretConfig.emailVerificationSecretKey, {
      expiresIn: secretConfig.emailTokenExpiry as SignOptions["expiresIn"],
    });
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(email: string, userId: string, name?: string): Promise<void> {
    try {
      // Generate verification token
      const token = this.generateVerificationToken(userId);

      // Store token in Redis with 24 hour expiration (in seconds)
      const redisKey = `verification:${userId}`;
      await this.redisService.set(redisKey, token, 24 * 60 * 60);

      // Create verification link
      const verificationLink = `${secretConfig.backendUrl}/verify-email?token=${token}`;

      // Prepare email content
      const sender = {
        email: secretConfig.senderEmail,
        name: secretConfig.senderName,
      };

      const recipients = [{ email }];

      const subject = "Verify Your Email Address";
      const html = this.getVerificationEmailTemplate(name || "User", verificationLink);
      const text = `Hello ${name || "User"},\n\nPlease verify your email address by clicking the following link:\n${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.`;

      // Send email
      await client.send({
        from: sender,
        to: recipients,
        subject,
        text,
        html,
        category: "Email Verification",
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email token from Redis
   */
  async verifyEmailToken(token: string): Promise<string | null> {
    try {
      const decoded = verify(token, secretConfig.accessSecretKey) as { userId: string; type: string };

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
    } catch (error) {
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
