export type User = {
  id: string;
  email: string;
  subscription: string;
  passwordHash: string;
  passwordSalt: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: string;
};
