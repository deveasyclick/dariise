import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  closeTestDatabase,
  loadApp,
  loadTestEnv,
  resetTestDatabase,
  seedWorkspace,
  signUp,
  truncateAll,
} from "./harness.js";

let app: Awaited<ReturnType<typeof loadApp>>;

beforeAll(async () => {
  // Before any import of the app: `config/index.ts` validates the environment
  // when it loads, and the pool it builds must point at the test database.
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

describe("test harness", () => {
  it("serves a route that needs no session", async () => {
    const response = await app.request("/healthz");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("drives a real route as a signed-in workspace owner", async () => {
    const session = await signUp(app);
    const workspace = await seedWorkspace(session.userId, "owner");

    const response = await app.request("/v1/projects", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: session.cookie },
      body: JSON.stringify({
        name: "Checkout Platform",
        environmentName: "Development",
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      key: "checkout-platform",
      name: "Checkout Platform",
    });

    const { db } = await import("../db/client.js");
    const { project } = await import("../db/schema/index.js");
    const rows = await db.select().from(project);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.organizationId).toBe(workspace.organizationId);
  });

  it("starts with an empty database, so per-test isolation can fail", async () => {
    const { db } = await import("../db/client.js");
    const { project } = await import("../db/schema/index.js");

    // The previous test committed a project. Without `truncateAll` in
    // `afterEach` this assertion fails, which is what makes it coverage.
    await expect(db.select().from(project)).resolves.toHaveLength(0);
  });
});
