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
import { ERROR_MESSAGES } from "constants/messages";
import { UserResponse } from "dto/common-response.dto";
import { EntityType } from "enums";
import { EmailService } from "shared/email/email.service";
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

    private readonly emailService: EmailService,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves the currently authenticated user's profile and associated attachments(profile image).
   *
   * @param userId - The unique identifier of the user.
   * @returns A promise resolving to the user combined with their attachment data {@link UserResponse}.
   * @throws NotFoundException if the user record does not exist.
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([user.id], EntityType.USER);

    return { ...user, attachment: attachmentMap[user.id] ?? [] };
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
    return await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);

      const { name, email, password } = body;

      const existingUser = await userRepository.findOne({ where: { email } });

      if (existingUser) {
        throw new ConflictException(ERROR_MESSAGES.USER_ALREADY_EXISTS);
      }

      const newUser = userRepository.create({
        name,
        email,
      });
      await newUser.setPassword(password);
      const savedUser = await userRepository.save(newUser);

      await this.emailService.sendVerificationEmail(email, savedUser.id, name);

      let attachmentArray: AttachmentEntity[] = [];

      if (file) {
        const attachment = await this.attachmentService.createAttachment(file, savedUser.id, EntityType.USER, manager);
        attachmentArray = [attachment];
      }

      return { ...savedUser, attachment: attachmentArray };
    });
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
    const { email, password } = body;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(ERROR_MESSAGES.VERIFY_YOUR_EMAIL);
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIAL);
    }

    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });
    const accessToken = generateAccessToken({ id: user.id, role: user.role });

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
    if (!refreshToken) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    let decodedToken: DecodedToken;
    try {
      decodedToken = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    if (!decodedToken.id) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const user = await this.userRepository.findOne({ where: { id: decodedToken.id } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const newAccessToken = generateAccessToken({ id: user.id, role: user.role });

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
    const { email, name, password } = body;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new ForbiddenException(ERROR_MESSAGES.INVALID_CREDENTIAL);
    }

    if (name !== undefined && name.trim() !== "") {
      user.name = name;
    }

    if (email !== undefined && email.trim() !== "") {
      const duplicateUser = await this.userRepository.findOne({ where: { email, id: Not(userId) } });

      if (duplicateUser) {
        throw new ConflictException(ERROR_MESSAGES.USER_ALREADY_EXISTS);
      }
      user.email = email;
      user.isEmailVerified = false;
      user.emailVerifiedAt = null;
      await this.emailService.sendVerificationEmail(user.email, user.id, user.name);
    }

    const savedUser = await this.userRepository.save(user);

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
    const userId = await this.emailService.verifyEmail(token);

    if (!userId) {
      throw new BadRequestException(ERROR_MESSAGES.EMAIL_VERIFICATION_LINK_INVALID);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.isEmailVerified) {
      return;
    }

    await this.userRepository.update(userId, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  /**
   * Initiates a new email verification request for an unverified account.
   *
   * @param email - The email address of the user.
   * @throws NotFoundException if no account is associated with the email.
   * @throws BadRequestException if the account is already verified.
   */
  async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new BadRequestException(ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED);
    }

    await this.emailService.resendVerificationEmail(user.email, user.id, user.name);
  }
}
