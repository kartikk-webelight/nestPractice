import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AttachmentService } from "modules/attachment/attachment.service";
import { UserEntity } from "modules/users/users.entity";
import { ERROR_MESSAGES } from "constants/messages";
import { EntityType } from "enums";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "utils/jwt";
import { CreateUser, DecodedToken, LoginUser, UpdateDetails } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    private readonly attachmentService: AttachmentService,
  ) {}

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const attachmentMap = await this.attachmentService.getAttachmentsByEntityIds([user.id], EntityType.USER);

    return { ...user, attachment: attachmentMap[user.id] ?? [] };
  }

  async create(body: CreateUser, file: Express.Multer.File) {
    const { name, email, password } = body;

    const newUser = this.userRepository.create({
      name,
      email,
    });
    await newUser.setPassword(password);

    const savedUser = await this.userRepository.save(newUser);

    const attachment = await this.attachmentService.createAttachment(file, savedUser.id, EntityType.USER);

    return { ...savedUser, attachment: [attachment] };
  }

  async login(body: LoginUser) {
    const { email, password } = body;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIAL);
    }

    const refreshToken = generateRefreshToken({ payload: user.id });
    const accessToken = generateAccessToken({ payload: user.id });

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

    if (!decodedToken.payload) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const user = await this.userRepository.findOne({ where: { id: decodedToken.payload } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const newAccessToken = generateAccessToken({ payload: user.id });

    return {
      newAccessToken,
    };
  }

  async updateDetails(body: UpdateDetails, userId: string) {
    const { email, name, password } = body;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new ForbiddenException(ERROR_MESSAGES.INVALID_CREDENTIAL);
    }

    if (name !== undefined && name.trim() !== "") {
      user.name = name.toLowerCase();
    }

    if (email !== undefined && email.trim() !== "") {
      user.email = email;
    }

    await this.userRepository.save(user);
    const savedUser = await this.userRepository.findOne({ where: { id: user.id } });
    if (!savedUser) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return savedUser;
  }

  async logoutUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return {};
  }
}
