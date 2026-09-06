import { describe, expect, it } from "vitest";
import { createBackup, createInitialState, parseBackup, parseStoredState } from "./storage";

describe("stored state", () => {
  it("round-trips a valid state", () => {
    const state = createInitialState();
    expect(parseStoredState(JSON.stringify(state))).toEqual(state);
  });

  it("rejects malformed and unsupported state", () => {
    expect(parseStoredState("not json")).toBeNull();
    expect(parseStoredState(JSON.stringify({ version: 2 }))).toBeNull();
  });
});

describe("backup validation", () => {
  it("round-trips a complete backup", () => {
    const state = createInitialState();
    const backup = createBackup(state, "2026-09-06T12:00:00.000Z");
    expect(parseBackup(JSON.stringify(backup))).toEqual(state);
  });

  it("rejects the wrong app and schema", () => {
    expect(() => parseBackup(JSON.stringify({ app: "other", schemaVersion: 3 }))).toThrow(/not a Productivity Bingo/);
    expect(() => parseBackup(JSON.stringify({ app: "productivity-bingo", schemaVersion: 2 }))).toThrow(/unsupported/);
  });

  it("rejects malformed state even with the right envelope", () => {
    expect(() => parseBackup(JSON.stringify({
      app: "productivity-bingo",
      schemaVersion: 3,
      exportedAt: "2026-09-06T12:00:00.000Z",
      data: { version: 3 },
    }))).toThrow(/invalid data/);
  });
});
