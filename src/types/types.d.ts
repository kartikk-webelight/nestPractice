import { UserEntity } from "modules/users/users.entity";
import { OrderBy } from "enums";

export type AnyType = any;

export type User = Omit<UserEntity, "password">;

export interface BaseQuery {
  search?: string;
  fromDate?: string;
  toDate?: string;
  order?: OrderBy;
  page: number;
  limit: number;
}

declare global {
  namespace Express {
    interface Request {
      user: Omit<UserEntity, "password">;
    }
  }
}

export {};
