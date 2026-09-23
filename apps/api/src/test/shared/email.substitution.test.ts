import { describe, expect, it } from "vitest";

import {
  substituteHtml,
  substituteText,
} from "../../modules/email/utils/substitution.js";

describe("substituteText", () => {
  it("replaces a placeholder and tolerates whitespace inside it", () => {
    expect(substituteText("Hi {{ name }}!", { name: "Ada" })).toBe("Hi Ada!");
  });

  it("leaves a value's own characters alone", () => {
    expect(substituteText("Hi {{name}}", { name: "A & B" })).toBe("Hi A & B");
  });

  it("throws when the template references a variable it was not given", () => {
    expect(() => substituteText("{{unknown}}", { name: "Ada" })).toThrow(
      'Unknown email template variable "{{unknown}}".',
    );
  });
});

describe("substituteHtml", () => {
  it("neutralises markup and attribute delimiters", () => {
    expect(
      substituteHtml("{{value}}", { value: `<script>alert("x")</script>` }),
    ).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(substituteHtml("{{value}}", { value: "A & B's" })).toBe(
      "A &amp; B&#39;s",
    );
  });

  it("escapes every occurrence, not only the first", () => {
    expect(substituteHtml("{{value}}", { value: "A & B & C < D" })).toBe(
      "A &amp; B &amp; C &lt; D",
    );
  });
});
