import { UserRole } from "enums";
import { BaseQuery } from "types/types";

export interface GetUsersQuery extends BaseQuery {
  role?: UserRole;
}
