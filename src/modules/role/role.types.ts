import { RoleStatus } from "enums";
import { BaseQuery } from "types/types";

export interface GetRoleRequestsQuery extends BaseQuery {
  status?: RoleStatus;
}
