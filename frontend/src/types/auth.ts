export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt?: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  accessToken: string;
  tokenType: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  details?: Record<string, string>;
  timestamp?: string;
}
