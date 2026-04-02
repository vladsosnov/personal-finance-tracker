import { parseCookies } from "../parse-cookies";

describe("parseCookies", () => {
  it("parses a single cookie", () => {
    expect(parseCookies("name=value")).toEqual({ name: "value" });
  });

  it("parses multiple cookies", () => {
    expect(parseCookies("a=1; b=2; c=3")).toEqual({ a: "1", b: "2", c: "3" });
  });

  it("handles URL-encoded values", () => {
    expect(parseCookies("name=hello%20world")).toEqual({ name: "hello world" });
  });

  it("returns empty object for undefined", () => {
    expect(parseCookies(undefined)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseCookies("")).toEqual({});
  });

  it("handles cookies with = in value", () => {
    expect(parseCookies("token=abc=def")).toEqual({ token: "abc=def" });
  });

  it("trims whitespace around cookie parts", () => {
    expect(parseCookies("  a=1 ;  b=2  ")).toEqual({ a: "1", b: "2" });
  });
});
