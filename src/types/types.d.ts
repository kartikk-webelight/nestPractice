// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyType = any;

type SearchType = { key: string; value: string };

import { User } from "../modules/users/users.entity";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
