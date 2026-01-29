import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "enums";

export interface DecodedToken extends JwtPayload {
  id: string;
  role: UserRole;
}
