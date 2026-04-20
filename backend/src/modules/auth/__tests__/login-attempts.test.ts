import { isAccountLocked, recordFailedAttempt, clearAttempts, _resetAll } from "../login-attempts";

describe("login-attempts", () => {
  beforeEach(() => _resetAll());

  it("does not lock on fewer than 5 failures", () => {
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt("user@test.com");
    }
    expect(isAccountLocked("user@test.com")).toBe(false);
  });

  it("locks after 5 failed attempts", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("user@test.com");
    }
    expect(isAccountLocked("user@test.com")).toBe(true);
  });

  it("clears lockout on successful login", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("user@test.com");
    }
    clearAttempts("user@test.com");
    expect(isAccountLocked("user@test.com")).toBe(false);
  });

  it("unlocks after lockout duration expires", () => {
    jest.useFakeTimers();
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("user@test.com");
    }
    expect(isAccountLocked("user@test.com")).toBe(true);
    jest.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(isAccountLocked("user@test.com")).toBe(false);
    jest.useRealTimers();
  });

  it("tracks different emails independently", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("a@test.com");
    }
    expect(isAccountLocked("a@test.com")).toBe(true);
    expect(isAccountLocked("b@test.com")).toBe(false);
  });
});
