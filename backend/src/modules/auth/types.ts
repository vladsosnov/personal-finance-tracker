export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  subscription: string;
  role: UserRole;
  passwordHash: string;
  passwordSalt: string;
  tokenVersion: number;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: string;
};
