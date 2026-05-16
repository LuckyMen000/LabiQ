import { api } from "./api";

export interface UserResponse {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  username: string;
  password: string;
}

export const loginUser = async (payload: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/auth/login", payload);
  return response.data;
};

export const registerUser = async (
  payload: RegisterRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/auth/register", payload);
  return response.data;
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await api.get<UserResponse>("/api/auth/me");
  return response.data;
};