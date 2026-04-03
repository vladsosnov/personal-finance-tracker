import { isValidEmail, emailRegex } from "../validation";

describe("isValidEmail", () => {
  it("accepts a standard email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("accepts email with subdomain", () => {
    expect(isValidEmail("user@mail.example.com")).toBe(true);
  });

  it("accepts email with plus alias", () => {
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  it("accepts email with dots in local part", () => {
    expect(isValidEmail("first.last@example.com")).toBe(true);
  });

  it("trims leading/trailing whitespace before validating", () => {
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });

  it("rejects missing @", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("rejects missing domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });

  it("rejects missing TLD", () => {
    expect(isValidEmail("user@example")).toBe(false);
  });

  it("rejects missing local part", () => {
    expect(isValidEmail("@example.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    expect(isValidEmail("   ")).toBe(false);
  });

  it("rejects email with spaces in local part", () => {
    expect(isValidEmail("user name@example.com")).toBe(false);
  });
});

describe("emailRegex", () => {
  it("matches a valid email", () => {
    expect(emailRegex.test("user@example.com")).toBe(true);
  });

  it("does not match an invalid email", () => {
    expect(emailRegex.test("notanemail")).toBe(false);
  });
});
