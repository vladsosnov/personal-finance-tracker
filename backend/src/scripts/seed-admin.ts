import dotenv from "dotenv";
import mongoose from "mongoose";
import { UserModel } from "../db/models/user.model";
import { hashPassword } from "../modules/auth/auth";

dotenv.config();

const seedAdmin = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!mongoUri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }
  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD env vars are required");
    console.error("Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret npx ts-node src/scripts/seed-admin.ts");
    process.exit(1);
  }
  if (adminPassword.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const existing = await UserModel.findOne({ email: adminEmail });
  if (existing) {
    await UserModel.updateOne({ email: adminEmail }, { $set: { role: "admin" } });
    console.log(`Promoted existing user "${adminEmail}" to admin.`);
  } else {
    const { hash, salt } = hashPassword(adminPassword);
    await UserModel.create({
      email: adminEmail,
      passwordHash: hash,
      passwordSalt: salt,
      role: "admin",
      subscription: "Free",
      emailVerified: true,
    });
    console.log(`Created admin user: ${adminEmail}`);
  }

  await mongoose.disconnect();
};

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
