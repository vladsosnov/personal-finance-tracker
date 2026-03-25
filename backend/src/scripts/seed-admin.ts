import dotenv from "dotenv";
import mongoose from "mongoose";
import { UserModel } from "../db/models/user.model";
import { hashPassword } from "../auth";

dotenv.config();

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "admin123";

const seedAdmin = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const existing = await UserModel.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    await UserModel.updateOne({ email: ADMIN_EMAIL }, { $set: { role: "admin" } });
    console.log(`Promoted existing user "${ADMIN_EMAIL}" to admin.`);
  } else {
    const { hash, salt } = hashPassword(ADMIN_PASSWORD);
    await UserModel.create({
      email: ADMIN_EMAIL,
      passwordHash: hash,
      passwordSalt: salt,
      role: "admin",
      subscription: "Free",
      emailVerified: true,
    });
    console.log(`Created admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }

  await mongoose.disconnect();
};

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
