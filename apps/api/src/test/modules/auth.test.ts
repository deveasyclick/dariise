import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { MeResponse } from "@dariise/contracts";

import {
  closeTestDatabase,
  loadApp,
  loadTestEnv,
  resetTestDatabase,
  seedWorkspace,
  signUp,
  truncateAll,
  TEST_PASSWORD,
  type TestSession,
} from "../harness.js";

/**
 * Integration coverage for the auth module: the Better Auth endpoints mounted at
 * `/api/auth/*`, the provider list and the session gate behind `GET /v1/me`.
 */

let app: Awaited<ReturnType<typeof loadApp>>;

beforeAll(async () => {
  loadTestEnv();
  await resetTestDatabase();
  app = await loadApp();
});

afterEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await closeTestDatabase();
});

function jsonHeaders(session?: TestSession): Record<string, string> {
  return {
    "content-type": "application/json",
    ...(session ? { cookie: session.cookie } : {}),
  };
}

async function me(session?: TestSession): Promise<MeResponse> {
  const response = await app.request("/v1/me", {
    headers: session ? { cookie: session.cookie } : {},
  });

  expect(response.status).toBe(200);

  return (await response.json()) as MeResponse;
}

describe("auth module", () => {
  it("lists the configured social providers", async () => {
    const session = await signUp(app);

    const response = await app.request("/v1/auth/providers");

    expect(response.status).toBe(200);
    const body = (await response.json()) as { enabled: string[] };

    expect(Array.isArray(body.enabled)).toBe(true);
    // The same list the dashboard reads from /v1/me, so the two cannot drift.
    expect((await me(session)).providers.enabled).toEqual(body.enabled);
  });

  it("reports onboarding state through /v1/me as it progresses", async () => {
    const session = await signUp(app);

    const fresh = await me(session);
    expect(fresh).toMatchObject({
      user: { id: session.userId, email: session.email, emailVerified: false },
      workspace: null,
      hasProject: false,
    });

    const workspace = await seedWorkspace(session.userId, "owner");

    const withWorkspace = await me(session);
    expect(withWorkspace.workspace).toMatchObject({
      id: workspace.organizationId,
      role: "owner",
    });
    expect(withWorkspace.hasProject).toBe(false);

    const created = await app.request("/v1/projects", {
      method: "POST",
      headers: jsonHeaders(session),
      body: JSON.stringify({
        name: "Checkout Platform",
        environmentName: "Development",
      }),
    });
    expect(created.status).toBe(201);

    expect((await me(session)).hasProject).toBe(true);
  });

  it("refuses /v1/me without a session", async () => {
    const response = await app.request("/v1/me");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "unauthorized" },
    });
  });

  it("signs in with the right password only", async () => {
    const session = await signUp(app);

    const wrong = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email: session.email, password: "not-the-password" }),
    });
    expect(wrong.status).toBeGreaterThanOrEqual(400);

    const right = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email: session.email, password: TEST_PASSWORD }),
    });
    expect(right.status).toBe(200);

    const cookie = (right.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
    expect(cookie).not.toBe("");

    const authenticated = await app.request("/v1/me", {
      headers: { cookie },
    });
    expect(authenticated.status).toBe(200);
  });

  it("signs out and stops honouring the old session", async () => {
    const session = await signUp(app);
    expect((await me(session)).user.id).toBe(session.userId);

    const signedOut = await app.request("/api/auth/sign-out", {
      method: "POST",
      headers: jsonHeaders(session),
    });
    expect(signedOut.status).toBe(200);

    const after = await app.request("/v1/me", {
      headers: { cookie: session.cookie },
    });
    expect(after.status).toBe(401);
  });

  it("answers a password reset the same way for known and unknown addresses", async () => {
    const session = await signUp(app);

    const known = await app.request("/api/auth/request-password-reset", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email: session.email }),
    });
    const unknown = await app.request("/api/auth/request-password-reset", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email: "nobody@example.com" }),
    });

    // Identical answers, or the endpoint would confirm which accounts exist.
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(known.status);
  });

  it("hashes the password rather than storing it", async () => {
    const session = await signUp(app);
    const { db } = await import("../../db/client.js");
    const { account } = await import("../../db/schema/index.js");

    const rows = await db.select().from(account);
    const credential = rows.find((row) => row.userId === session.userId);

    expect(credential?.password).toBeTruthy();
    expect(credential?.password).not.toBe(TEST_PASSWORD);
    expect(credential?.password).not.toContain(TEST_PASSWORD);
  });
});
