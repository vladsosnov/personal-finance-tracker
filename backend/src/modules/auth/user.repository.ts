import mongoose from "mongoose";
import { UserModel } from "../../db/models/user.model";
import type { User } from "./types";

const toUser = (doc: {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  passwordSalt: string;
}): User => ({
  id: doc._id.toString(),
  email: doc.email,
  passwordHash: doc.passwordHash,
  passwordSalt: doc.passwordSalt,
});

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
  return user
    ? toUser(user as unknown as { _id: mongoose.Types.ObjectId; email: string; passwordHash: string; passwordSalt: string })
    : undefined;
};

export const createUser = async (email: string, passwordHash: string, passwordSalt: string): Promise<User> => {
  const user = await UserModel.create({
    email: email.toLowerCase(),
    passwordHash,
    passwordSalt,
  });

  return toUser(
    user.toObject() as unknown as {
      _id: mongoose.Types.ObjectId;
      email: string;
      passwordHash: string;
      passwordSalt: string;
    }
  );
};

export const findUserById = async (id: string): Promise<User | undefined> => {
  const user = await UserModel.findById(id).lean();
  return user
    ? toUser(user as unknown as { _id: mongoose.Types.ObjectId; email: string; passwordHash: string; passwordSalt: string })
    : undefined;
};
