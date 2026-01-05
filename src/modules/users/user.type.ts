export interface create {
  name: string;
  email: string;
  password: string;
}
export interface login {
  email: string;
  password: string;
}
export interface decodedToken {
  id: string;
}
