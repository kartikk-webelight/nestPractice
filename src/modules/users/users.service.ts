import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "./users.entity";
import { AuthHelperService } from "../auth/auth.helper.service";
import { CreateUser, DecodedToken, LoginUser, UpdateDetails } from "./user.type";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authHelperService: AuthHelperService,
  ) {}

  async create(user: CreateUser): Promise<UserEntity> {
    const newUser = this.userRepository.create({
      name: user.name,
      email: user.email,
    });
    await newUser.setPassword(user.password);
    const savedUser = await this.userRepository.save(newUser);

    if (!savedUser) {
      throw new NotFoundException("saved user not found");
    }

    return savedUser;
  }

  async getAllUsers(page: number, limit: number) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async login(body: LoginUser) {
    const { email, password } = body;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new UnauthorizedException("incorrect password");
    }

    const refreshToken = this.authHelperService.generateRefreshToken({ payload: user.id }, "7d");
    const accessToken = this.authHelperService.generateAccessToken({ payload: user.id }, "1d");

    user.refreshToken = refreshToken;
    await this.userRepository.save(user);

    return {
      refreshToken,
      accessToken,
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("refreshToken required");
    }

    let decodedToken: DecodedToken;
    try {
      decodedToken = this.authHelperService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedException("invalid token");
    }

    if (!decodedToken.id) {
      throw new UnauthorizedException("invalid token");
    }

    const user = await this.userRepository.findOne({ where: { id: decodedToken.id } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.refreshToken !== refreshToken) {
      throw new ForbiddenException("Incorrect refresh token");
    }
    const newRefreshToken = this.authHelperService.generateRefreshToken({ payload: user.id }, "7d");
    const newAccessToken = this.authHelperService.generateAccessToken({ payload: user.id }, "1d");

    user.refreshToken = newRefreshToken;
    await this.userRepository.save(user);

    return {
      newRefreshToken,
      newAccessToken,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateDetails(body: UpdateDetails, userId: string) {
    const { email, name, password } = body;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new ForbiddenException("invalid password");
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
      throw new NotFoundException("user not found");
    }
    return savedUser;
  }

  async logoutUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException("user not found");
    }

    user.refreshToken = "";

    await this.userRepository.save(user);

    return {};
  }

  async findById(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("user not found");
    }
    return user;
  }
}
