import { describe, expect, it } from "vitest";
import { safePromise } from "./safe-promise";

describe("safePromise", () => {
  it("should return [value, null] when the promise resolves", async () => {
    const [value, error] = await safePromise(Promise.resolve("success"));

    expect(value).toBe("success");
    expect(error).toBeNull();
  });

  it("should return [null, Error] when the promise rejects with an Error instance", async () => {
    const testError = new Error("something went wrong");
    const [value, error] = await safePromise(Promise.reject(testError));

    expect(value).toBeNull();
    expect(error).toBe(testError);
  });

  it("should wrap a non-Error rejection value into an Error instance", async () => {
    const [value, error] = await safePromise(
      Promise.reject("plain string reason"),
    );

    expect(value).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("plain string reason");
  });

  it("should resolve with complex object values unchanged", async () => {
    const payload = { id: "123", nested: { active: true } };
    const [value, error] = await safePromise(Promise.resolve(payload));

    expect(value).toEqual(payload);
    expect(error).toBeNull();
  });
});
