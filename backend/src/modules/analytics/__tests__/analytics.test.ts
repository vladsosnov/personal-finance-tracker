import { isTrackedEvent, TRACKED_EVENTS } from "../analytics.repository";

describe("isTrackedEvent", () => {
  it("returns true for valid tracked events", () => {
    expect(isTrackedEvent("login_click")).toBe(true);
    expect(isTrackedEvent("register_success")).toBe(true);
    expect(isTrackedEvent("data_exported")).toBe(true);
    expect(isTrackedEvent("operation_added")).toBe(true);
  });

  it("returns false for unknown events", () => {
    expect(isTrackedEvent("unknown_event")).toBe(false);
    expect(isTrackedEvent("")).toBe(false);
    expect(isTrackedEvent("LOGIN_CLICK")).toBe(false);
  });

  it("validates all defined tracked events", () => {
    for (const event of TRACKED_EVENTS) {
      expect(isTrackedEvent(event)).toBe(true);
    }
  });
});
