export interface CreateUser {
  name: string;
  email: string;
  password: string;
}
export interface LoginUser {
  email: string;
  password: string;
}
export interface DecodedToken {
  id: string;
}

export interface UpdateDetails {
  name?: string;
  email?: string;
  password: string;
}
