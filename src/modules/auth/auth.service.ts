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
import { EntityType } from "enums";
import { EmailService } from "shared/email/email.service";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "utils/jwt";
import { DecodedToken } from "./auth.types";
import { CreateUserDto, LoginDto, UpdateDetailsDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    private readonly attachmentService: AttachmentService,

    private readonly emailService: EmailService,

    private readonly dataSource: DataSource,
  ) {}

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([user.id], EntityType.USER);

    return { ...user, attachment: attachmentMap[user.id] ?? [] };
  }

  async create(body: CreateUserDto, file: Express.Multer.File) {
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

  async login(body: LoginDto) {
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

  async refreshToken(refreshToken: string) {
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

  async updateDetails(body: UpdateDetailsDto, userId: string) {
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

  async logoutUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
  }

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
