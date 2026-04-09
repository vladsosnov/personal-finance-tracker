import { isValidObjectId, assertValidObjectId } from "../object-id";

describe("isValidObjectId", () => {
  it("accepts valid 24-char hex string", () => {
    expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
  });

  it("accepts uppercase hex", () => {
    expect(isValidObjectId("507F1F77BCF86CD799439011")).toBe(true);
  });

  it("accepts mixed case hex", () => {
    expect(isValidObjectId("507f1F77bcF86cd799439011")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidObjectId("")).toBe(false);
  });

  it("rejects too short string", () => {
    expect(isValidObjectId("507f1f77bcf86cd79943901")).toBe(false);
  });

  it("rejects too long string", () => {
    expect(isValidObjectId("507f1f77bcf86cd7994390111")).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isValidObjectId("507f1f77bcf86cd79943901g")).toBe(false);
  });

  it("rejects special characters", () => {
    expect(isValidObjectId("507f1f77bcf86cd79943901!")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isValidObjectId("507f1f77bcf86cd7 9943901")).toBe(false);
  });

  it("rejects potential NoSQL injection", () => {
    expect(isValidObjectId('{"$gt":""}' as string)).toBe(false);
  });
});

describe("assertValidObjectId", () => {
  it("does not throw for valid ID", () => {
    expect(() => assertValidObjectId("507f1f77bcf86cd799439011")).not.toThrow();
  });

  it("throws for invalid ID with default label", () => {
    expect(() => assertValidObjectId("invalid")).toThrow("Invalid ID");
  });

  it("throws for invalid ID with custom label", () => {
    expect(() => assertValidObjectId("invalid", "goal ID")).toThrow("Invalid goal ID");
  });
});
