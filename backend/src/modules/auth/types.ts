export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  subscription: string;
  role: UserRole;
  primaryCurrency: string;
  passwordHash: string;
  passwordSalt: string;
  googleId?: string;
  tokenVersion: number;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: string;
};
