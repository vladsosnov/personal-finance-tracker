import { countQueryDepth } from "../query-depth";

describe("countQueryDepth", () => {
  it("returns 0 for empty string", () => {
    expect(countQueryDepth("")).toBe(0);
  });

  it("returns 0 for string without braces", () => {
    expect(countQueryDepth("query { }")).toBe(1);
  });

  it("counts single nesting level", () => {
    expect(countQueryDepth("{ goals }")).toBe(1);
  });

  it("counts nested depth", () => {
    expect(countQueryDepth("{ goals { id title } }")).toBe(2);
  });

  it("counts deeply nested query", () => {
    expect(countQueryDepth("{ goals { operations { id } } }")).toBe(3);
  });

  it("handles multiple siblings at same depth", () => {
    expect(countQueryDepth("{ a { x } b { y } }")).toBe(2);
  });

  it("returns max depth across branches", () => {
    expect(countQueryDepth("{ a { b { c } } d }")).toBe(3);
  });

  it("handles flat query", () => {
    expect(countQueryDepth("query me")).toBe(0);
  });

  it("ignores braces inside string literals", () => {
    expect(countQueryDepth('{ field(arg: "{{{{") }')).toBe(1);
  });

  it("ignores closing braces inside strings", () => {
    expect(countQueryDepth('{ field(arg: "}}}}") }')).toBe(1);
  });

  it("handles escaped quotes inside strings", () => {
    expect(countQueryDepth('{ field(arg: "val\\"ue") }')).toBe(1);
  });

  it("handles mixed braces in and out of strings", () => {
    expect(countQueryDepth('{ a { b(x: "{ }") } }')).toBe(2);
  });

  it("handles empty string argument", () => {
    expect(countQueryDepth('{ field(arg: "") }')).toBe(1);
  });

  it("handles backslash not before quote", () => {
    expect(countQueryDepth('{ field(arg: "a\\b") }')).toBe(1);
  });
});
