import { OrderBy, UserRole } from "enums";

export interface GetUsersQuery {
  name?: string;
  email?: string;
  role?: UserRole;
  fromDate?: string;
  toDate?: string;
  order?: OrderBy;
  page: number;
  limit: number;
}
