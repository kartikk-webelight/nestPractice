import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "enums";

export interface CreateUser {
  name: string;
  email: string;
  password: string;
}
export interface LoginUser {
  email: string;
  password: string;
}
export interface DecodedToken extends JwtPayload {
  id: string;
  role: UserRole;
}

export interface UpdateDetails {
  name?: string;
  email?: string;
  password: string;
}
