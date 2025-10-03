// here i will define all tpes required for user related operations

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string; // In a real application, passwords should be hashed
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
}


export interface ErrorResponse {
  message: string;
  statusCode: number;
}


export interface SuccessResponse {
  message: string;
  statusCode: number;
}


export interface UserState {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}


