import { UserEntity } from "modules/users/users.entity";

export type AnyType = any;

export type User = Omit<UserEntity, "password">;

interface SearchType {
  key: string;
  value: string;
}

declare global {
  namespace Express {
    interface Request {
      user: Omit<UserEntity, "password">;
    }
  }
}

export {};
