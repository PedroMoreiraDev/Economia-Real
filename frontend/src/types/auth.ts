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

export interface RegistrationResultResponse {
  userId: string;
  email: string;
  fullName: string;
  requiresVerification: boolean;
  message: string;
}

export interface CaptchaChallenge {
  challengeId: string;
  imageBase64: string;
  question?: string;
  token: string;
}

export interface ForgotPasswordPayload {
  email: string;
  captchaToken?: string;
  captchaAnswer?: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  captchaToken?: string;
  captchaAnswer?: string;
}

export interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
  captchaToken?: string;
  captchaAnswer?: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendCodePayload {
  email: string;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  details?: Record<string, string>;
  timestamp?: string;
}
