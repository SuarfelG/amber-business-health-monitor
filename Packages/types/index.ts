export enum UserRole {
  OWNER = 'OWNER',
  ADVISOR = 'ADVISOR',
}

export interface User {
  id: string;
  email: string;
  name: string;
  businessName: string;
  timezone: string;
  currency: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
