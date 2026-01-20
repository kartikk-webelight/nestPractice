import { OrderBy, RoleStatus } from "enums";

export interface GetRoleRequestsQuery {
  name?: string;
  status?: RoleStatus;
  order?: OrderBy;
  fromDate?: string;
  toDate?: string;
  page: number;
  limit: number;
}
