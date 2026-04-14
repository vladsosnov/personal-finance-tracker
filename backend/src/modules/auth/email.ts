import { createTransport } from "nodemailer";

const FRONTEND_URL = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) return null;
  return createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const smtpFrom = process.env.SMTP_FROM ?? "noreply@financialgoals.app";
  const transporter = getTransporter();
  if (transporter) {
    await transporter.sendMail({ from: smtpFrom, to, subject, html });
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is required in production");
    }
    console.log("\n========== EMAIL (dev mode) ==========");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(html.replace(/<[^>]+>/g, ""));
    console.log("======================================\n");
  }
};

export const sendVerificationEmail = async (to: string, token: string) => {
  const link = `${FRONTEND_URL}/auth/verify-email?token=${token}`;
  await sendEmail(
    to,
    "Verify your email - Financial Goals Tracker",
    `<h2>Verify your email</h2>
     <p>Click the link below to verify your email address:</p>
     <p><a href="${link}">${link}</a></p>
     <p>This link expires in 24 hours.</p>
     <p>If you didn't create an account, you can ignore this email.</p>`
  );
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const link = `${FRONTEND_URL}/auth/reset-password?token=${token}`;
  await sendEmail(
    to,
    "Reset your password - Financial Goals Tracker",
    `<h2>Reset your password</h2>
     <p>Click the link below to reset your password:</p>
     <p><a href="${link}">${link}</a></p>
     <p>This link expires in 1 hour.</p>
     <p>If you didn't request this, you can ignore this email.</p>`
  );
};
