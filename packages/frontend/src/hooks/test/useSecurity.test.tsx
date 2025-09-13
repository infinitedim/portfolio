import { describe, it, expect } from "vitest";

describe("useSecurity utilities", () => {
  it("createThreatAlert returns proper shape", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const alert = require("../useSecurity").createThreatAlert(
      "suspicious_input",
      "msg",
      "low",
      {},
    );
    expect(alert).toHaveProperty("id");
    expect(alert.type).toBe("suspicious_input");
  });
});
