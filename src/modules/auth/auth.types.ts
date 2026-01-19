import { JwtPayload } from "jsonwebtoken";

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
  payload: string;
}

export interface UpdateDetails {
  name?: string;
  email?: string;
  password: string;
}
