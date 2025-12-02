export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: Role;
}

export enum Role {
  Unspecified,
  User,
  Admin,
}
