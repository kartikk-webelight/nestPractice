import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ERROR_MESSAGES } from "constants/messages.constants";
import { Repository } from "typeorm";

import { AuthHelperService } from "../auth/auth.helper.service";
import { UserEntity } from "../users/users.entity";
import { CreateUser, DecodedToken, LoginUser, UpdateDetails } from "./auth.types";
import { CloudinaryService } from "shared/cloudinary/cloudinary.service";
import { UploadApiResponse } from "cloudinary";
import { AttachmentEntity } from "modules/post/entities/attachment.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    private readonly authHelperService: AuthHelperService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async create(body: CreateUser, file: Express.Multer.File): Promise<UserEntity> {
    const { name, email, password } = body;
    let uploadedFile: UploadApiResponse;
    let attachment
    try {
      uploadedFile = await this.cloudinaryService.uploadBufferToCloudinary(file);

       attachment = this.attachmentRepository.create({
        url: uploadedFile.secure_url,
        mimeType: uploadedFile.format,
        size: uploadedFile.bytes,
        originalName: uploadedFile.original_filename,
      })


    } catch (error) {
      throw new InternalServerErrorException(ERROR_MESSAGES.CLOUDINARY_UPLOAD_FAILED);
    }
    const newUser = this.userRepository.create({
      name: name,
      email: email,
      profileImage:attachment
    });
    await newUser.setPassword(password);


    const savedUser = await this.userRepository.save(newUser);

    if (!savedUser) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return savedUser;
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

    const refreshToken = this.authHelperService.generateRefreshToken({ payload: user.id });
    const accessToken = this.authHelperService.generateAccessToken({ payload: user.id });

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
      decodedToken = this.authHelperService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    if (!decodedToken.payload) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }


    const user = await this.userRepository.findOne({ where: { id: decodedToken.payload} });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const newAccessToken = this.authHelperService.generateAccessToken({ payload: user.id });

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

    await this.userRepository.save(user);

    return {};
  }
}
