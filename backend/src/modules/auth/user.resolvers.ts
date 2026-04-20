import { findUserById, updatePrimaryCurrency } from "./user.repository";
import { ensureAuthed, toSafeUser, assertValidCurrency } from "../../utils/validation";

type Context = {
  userId: string | null;
  userRole: "user" | "admin";
  tokenVersion: number;
  clientIp: string;
};

export const userResolvers = {
  me: async (_args: unknown, context: Context) => {
    const userId = context.userId;
    if (!userId) {
      return null;
    }

    const user = await findUserById(userId);
    return user ? toSafeUser(user) : null;
  },
  setPrimaryCurrency: async ({ currency }: { currency: string }, context: Context) => {
    const userId = ensureAuthed(context);
    assertValidCurrency(currency);

    const user = await updatePrimaryCurrency(userId, currency);
    if (!user) {
      throw new Error("User not found");
    }

    return toSafeUser(user);
  },
};
