export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role?: Role;
}

export enum Role {
  Unspecified,
  User,
  Admin,
}
