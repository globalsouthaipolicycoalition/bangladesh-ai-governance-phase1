import { describe, expect, it } from "vitest";
import { getTrustedAppOrigin } from "./appOrigin";

describe("trusted application origin", () => {
  it("accepts a canonical HTTPS origin only", () => {
    expect(getTrustedAppOrigin("https://aagra.example")).toBe("https://aagra.example");
    expect(getTrustedAppOrigin("https://aagra.example/")).toBe("https://aagra.example");
  });
  it("rejects host-header, plaintext, credential, path, and malformed origins", () => {
    for (const value of [undefined, "", "http://aagra.example", "//aagra.example", "https://user:pass@aagra.example", "https://aagra.example/subpath", "https://aagra.example/?next=x", "not-a-url"]) {
      expect(getTrustedAppOrigin(value)).toBeUndefined();
    }
  });
});
