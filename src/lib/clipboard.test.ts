import { describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard";

describe("copyText", () => {
  it("sends the exact transformed value to the clipboard writer", async () => {
    const write = vi.fn(async () => undefined);
    await expect(copyText("HELLO_WORLD", write)).resolves.toBe(true);
    expect(write).toHaveBeenCalledWith("HELLO_WORLD");
  });

  it("does nothing safely for empty output", async () => {
    const write = vi.fn(async () => undefined);
    await expect(copyText("", write)).resolves.toBe(false);
    expect(write).not.toHaveBeenCalled();
  });
});
