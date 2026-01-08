import { User } from "../modules/users/users.entity";

export type AnyType = any;

type SearchType = { key: string; value: string };

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
