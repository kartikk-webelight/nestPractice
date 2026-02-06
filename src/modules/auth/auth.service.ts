import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Not, Repository } from "typeorm";
import { AttachmentEntity } from "modules/attachment/attachment.entity";
import { AttachmentService } from "modules/attachment/attachment.service";
import { UserEntity } from "modules/users/users.entity";
import { CACHE_PREFIX } from "constants/cache-prefixes";
import { DURATION_CONSTANTS } from "constants/duration";
import { ERROR_MESSAGES } from "constants/messages";
import { UserResponse } from "dto/common-response.dto";
import { EntityType } from "enums";
import { logger } from "services/logger.service";
import { CacheService } from "shared/cache/cache.service";
import { EmailQueue } from "shared/email/email.queue";
import { EmailService } from "shared/email/email.service";
import { getCachedJson, getCacheKey } from "utils/cache";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "utils/jwt";
import { DecodedToken } from "./auth.types";
import { LoginResponse, RefreshTokenResponse } from "./dto/auth-response.dto";
import { CreateUserDto, LoginDto, UpdateDetailsDto } from "./dto/auth.dto";

/**
 * Provides comprehensive identity management including authentication, registration, and account recovery.
 *
 * @remarks
 * This service manages the security lifecycle of a user, handling credential validation,
 * token issuance (JWT), email verification workflows, and secure profile updates.
 * * @group Identity Services
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    private readonly attachmentService: AttachmentService,

    private readonly emailQueue: EmailQueue,

    private readonly emailService: EmailService,

    private readonly cacheService: CacheService,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves the currently authenticated user's profile along with their attachments (e.g., profile image).
   *
   * This method first checks Redis cache for the user. If not found, it fetches the user from the database,
   * maps their attachments, caches the result, and returns it.
   *
   * @param userId - The unique identifier of the user.
   * @returns A promise resolving to the user combined with their attachment data {@link UserResponse}.
   * @throws NotFoundException if the user record does not exist.
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    logger.info("Fetching current user profile. ID: %s", userId);

    // Step 1: Fetch user by ID

    const userCacheKey = getCacheKey(CACHE_PREFIX.USER, userId);

    const cachedUser = await getCachedJson<UserResponse>(userCacheKey, this.cacheService);

    if (cachedUser) {
      logger.info("Cache hit for user profile. ID: %s", userId);

      return cachedUser;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      logger.warn("Profile fetch failed: User %s not found", userId);

      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Step 2: Fetch and map related attachments

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([user.id], EntityType.USER);

    const userWithAttachments = { ...user, attachment: attachmentMap[user.id] ?? [] };

    await this.cacheService.set(userCacheKey, JSON.stringify(userWithAttachments), DURATION_CONSTANTS.TWO_MIN_IN_SEC);

    return userWithAttachments;
  }

  /**
   * Processes new user registration within a database transaction, including file upload and verification email.
   *
   * @param body - The {@link CreateUserDto} data containing registration details.
   * @param file - Optional profile image file to be processed.
   * @returns A promise resolving to the newly created user and their profile attachment {@link UserResponse}.
   * @throws ConflictException if the email address is already registered.
   */
  async create(body: CreateUserDto, file: Express.Multer.File): Promise<UserResponse> {
    logger.info("Starting user registration process for: %s", body.email);

    // Step 1: Start transaction to ensure user and attachment are created together

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);

      const { name, email, password } = body;

      const existingUser = await userRepository.findOne({ where: { email } });

      if (existingUser) {
        logger.warn("Registration conflict: Email %s is already in use", email);

        throw new ConflictException(ERROR_MESSAGES.USER_ALREADY_EXISTS);
      }

      const newUser = userRepository.create({
        name,
        email,
      });
      await newUser.setPassword(password);
      const saved = await userRepository.save(newUser);

      logger.debug("User record saved to database. ID: %s", saved.id);

      let attachmentArray: AttachmentEntity[] = [];

      if (file) {
        const attachment = await this.attachmentService.createAttachment({
          file,
          externalId: saved.id,
          entityType: EntityType.USER,
          manager,
        });
        attachmentArray = [attachment];
      }

      return { ...saved, attachment: attachmentArray };
    });
    // Step 2: User and attachments secured. Queueing verification email.

    await this.emailQueue.enqueueVerification(savedUser.email, savedUser.id, savedUser.name);

    logger.info("Registration complete for user: %s", savedUser.id);

    return savedUser;
  }

  /**
   * Validates user credentials and issues a new set of authentication tokens.
   *
   * @param body - The {@link LoginDto} credentials.
   * @returns A promise resolving to an object containing the accessToken and refreshToken {@link LoginResponse}.
   * @throws NotFoundException if the email is not found.
   * @throws UnauthorizedException if credentials are invalid or email is unverified.
   */
  async login(body: LoginDto): Promise<LoginResponse> {
    logger.info("Login attempt received for email: %s", body.email);

    const { email, password } = body;

    // Step 1: Fetch user and verify their credentials

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      logger.warn("Login failed: Account with email %s does not exist", email);

      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.isEmailVerified) {
      logger.warn("Login blocked: User %s has not verified their email", email);

      throw new UnauthorizedException(ERROR_MESSAGES.VERIFY_YOUR_EMAIL);
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      logger.warn("Security Alert: Invalid password attempt for user: %s", email);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIAL);
    }

    // Step 2: Credentials valid. Issuing JWT access and refresh tokens.

    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });
    const accessToken = generateAccessToken({ id: user.id, role: user.role });

    await this.invalidateUserCaches(user.id);

    logger.info("Login successful. Tokens issued for user: %s", user.id);

    return {
      refreshToken,
      accessToken,
    };
  }

  /**
   * Generates a new access token using a valid refresh token.
   *
   * @param refreshToken - The current refresh token string.
   * @returns A promise resolving to the newAccessToken {@link RefreshTokenResponse}.
   * @throws UnauthorizedException if the token is missing, expired, or malformed.
   * @throws NotFoundException if the user associated with the token no longer exists.
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    logger.info("Token Refresh Request: Processing rotation for provided token.");

    // Step 1: Validate refresh token and fetch user

    if (!refreshToken) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    let decodedToken: DecodedToken;
    try {
      decodedToken = verifyRefreshToken(refreshToken);
    } catch {
      logger.warn("Security Alert: Invalid or expired refresh token attempt.");

      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    if (!decodedToken.id) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const user = await this.userRepository.findOne({ where: { id: decodedToken.id } });

    if (!user) {
      logger.error("Token Conflict: Refresh token belongs to a user that no longer exists.");

      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const newAccessToken = generateAccessToken({ id: user.id, role: user.role });

    // Step 1: Token validated and user active. Generating new access token.

    logger.debug("Access token successfully rotated for UserID: %s", user.id);

    return {
      newAccessToken,
    };
  }

  /**
   * Updates user account details and triggers re-verification if the email address is changed.
   *
   * @param body - The {@link UpdateDetailsDto} object.
   * @param userId - The identifier of the user being updated.
   * @returns A promise resolving to the updated user entity {@link UserResponse}.
   * @throws NotFoundException if the user is not found.
   * @throws ForbiddenException if the current password confirmation fails.
   * @throws ConflictException if the new email is already in use by another account.
   */
  async updateDetails(body: UpdateDetailsDto, userId: string): Promise<UserResponse> {
    // Step 1: Update profile fields and confirm current password to ensure only the owner can modify their account

    logger.info("Updating profile details for UserID: %s", userId);

    const { email, name, password } = body;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      logger.warn("Update denied: Incorrect password confirmation for UserID: %s", userId);

      throw new ForbiddenException(ERROR_MESSAGES.INVALID_CREDENTIAL);
    }

    if (name !== undefined && name.trim() !== "") {
      user.name = name;
    }

    let emailChanged = false;

    if (email !== undefined && email.trim() !== "") {
      // Step 2: Handle email changes by resetting verification and queuing a new verification email to maintain account security

      const duplicateUser = await this.userRepository.findOne({ where: { email, id: Not(userId) } });

      if (duplicateUser) {
        throw new ConflictException(ERROR_MESSAGES.USER_ALREADY_EXISTS);
      }
      user.email = email;
      user.isEmailVerified = false;
      user.emailVerifiedAt = null;
      emailChanged = true;
    }

    const savedUser = await this.userRepository.save(user);

    await this.invalidateUserCaches(userId);

    logger.info("Profile updated successfully for UserID: %s. Email changed: %s", userId, emailChanged);

    if (emailChanged) {
      await this.emailQueue.enqueueVerification(user.email, user.id, user.name);
    }

    return savedUser;
  }

  /**
   * Finalizes the email verification process via a secure token.
   *
   * @param token - The unique verification token sent via email.
   * @throws BadRequestException if the token is invalid or has expired.
   * @throws NotFoundException if the user linked to the token is not found.
   */
  async verifyEmail(token: string) {
    logger.info("Email Verification: Processing token verification.");

    // Step 1: Validate the verification token and fetch the linked user to ensure the token is valid and active

    const userId = await this.emailService.verifyEmail(token);

    if (!userId) {
      logger.warn("Verification Failed: Provided token is invalid or has expired.");
      throw new BadRequestException(ERROR_MESSAGES.EMAIL_VERIFICATION_LINK_INVALID);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.isEmailVerified) {
      return;
    }

    // Step 2: Update verification status and timestamp to complete the email confirmation workflow
    await this.userRepository.update(userId, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });
    logger.info("Account Verified: UserID %s successfully completed email verification.", userId);
  }

  /**
   * Initiates a new email verification request for an unverified account.
   *
   * @param email - The email address of the user.
   * @throws NotFoundException if no account is associated with the email.
   * @throws BadRequestException if the account is already verified.
   */
  async resendVerificationEmail(email: string) {
    logger.info("Resend Verification: Request received for email: %s", email);

    // Step 1: Confirm the user exists and is not already verified to avoid unnecessary email sends

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      logger.warn("Resend Aborted: No account associated with email: %s", email);
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.isEmailVerified) {
      logger.info("Resend Ignored: User %s is already verified.", email);
      throw new BadRequestException(ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED);
    }

    // Step 2: Queue a new verification email to allow the user to complete account verification

    await this.emailQueue.enqueueVerification(user.email, user.id, user.name);
    logger.info("Verification email successfully re-queued for: %s", email);
  }

  /**
   * Clears Redis caches for a user and related user lists.
   * @param userId - ID of the user to invalidate
   */
  private async invalidateUserCaches(userId: string): Promise<void> {
    const userCacheKey = getCacheKey(CACHE_PREFIX.USER, userId);
    const authCacheKey = getCacheKey(CACHE_PREFIX.AUTH, userId);

    await this.cacheService.delete([userCacheKey, authCacheKey]);
  }
}
