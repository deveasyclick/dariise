import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { bucketFor } from "./bucket.js";
import { sha256, utf8Bytes } from "./sha256.js";

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** The digest Node computes, which is the value the engine used before. */
function nodeDigest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

const CORPUS = [
  "",
  "a",
  "abc",
  "checkout-v2:v1:user-1",
  "checkout-v2:v1:",
  "flag:v1:user-42",
  "x".repeat(55),
  "x".repeat(56),
  "x".repeat(63),
  "x".repeat(64),
  "x".repeat(65),
  "x".repeat(1000),
  "héllo wörld",
  "emoji 🚀 flag",
  "\u0000\u0001\u0002",
  "日本語のフラグ",
  "\ud83d\ude00", // a surrogate pair
  "\ud83d", // a lone high surrogate
  "\ude00", // a lone low surrogate
];

describe("sha256", () => {
  it("matches node:crypto over the corpus", () => {
    for (const value of CORPUS) {
      expect(hex(sha256(utf8Bytes(value))), value).toBe(nodeDigest(value));
    }
  });

  it("matches the published vectors", () => {
    expect(hex(sha256(utf8Bytes("abc")))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(hex(sha256(utf8Bytes("")))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});

describe("bucketFor", () => {
  it("matches the sha256 the engine used before", () => {
    for (const flagKey of ["checkout-v2", "flag-a", "flag-b"]) {
      for (const value of ["user-1", "user-2", "acme", ""]) {
        const digest = createHash("sha256")
          .update(`${flagKey}:v1:${value}`, "utf8")
          .digest();

        expect(bucketFor(flagKey, value), `${flagKey}/${value}`).toBe(
          digest.readUInt32BE(0) % 100,
        );
      }
    }
  });
});
