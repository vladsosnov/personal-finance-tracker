describe("auth email", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws when SMTP is missing in production", async () => {
    process.env.NODE_ENV = "production";

    const { sendVerificationEmail } = await import("../email");

    await expect(sendVerificationEmail("user@example.com", "token")).rejects.toThrow("SMTP is required in production");
  });
});
