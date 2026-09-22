import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { FlagDetail } from "@dariise/contracts";

import {
  closeTestDatabase,
  loadApp,
  loadTestEnv,
  resetTestDatabase,
  seedProject,
  seedWorkspace,
  signUp,
  truncateAll,
  type TestSession,
} from "../harness.js";

let app: Awaited<ReturnType<typeof loadApp>>;

const VARIATIONS = [
  { key: "on", name: "On", value: true, description: null },
  { key: "off", name: "Off", value: false, description: null },
];

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

async function seedEnvironment(
  projectId: string,
  key: string,
  name: string,
): Promise<string> {
  const { db } = await import("../../db/client.js");
  const { environment } = await import("../../db/schema/index.js");
  const id = randomUUID();

  await db.insert(environment).values({ id, projectId, key, name });

  return id;
}

async function seedProjectMember(
  projectId: string,
  userId: string,
  role: string,
): Promise<void> {
  const { db } = await import("../../db/client.js");
  const { projectMember } = await import("../../db/schema/index.js");

  await db
    .insert(projectMember)
    .values({ id: randomUUID(), projectId, userId, role });
}

async function ownerFixture(): Promise<{
  session: TestSession;
  organizationId: string;
  projectKey: string;
  projectId: string;
}> {
  const session = await signUp(app);
  const workspace = await seedWorkspace(session.userId, "owner");
  const project = await seedProject(workspace.organizationId);

  return {
    session,
    organizationId: workspace.organizationId,
    projectKey: project.key,
    projectId: project.projectId,
  };
}

function headers(session: TestSession): Record<string, string> {
  return { "content-type": "application/json", cookie: session.cookie };
}

describe("flags module", () => {
  it("keeps configuration per environment and records one audit row per mutation", async () => {
    const { session, organizationId, projectKey, projectId } =
      await ownerFixture();

    const staging = await seedEnvironment(projectId, "staging", "Staging");
    await seedEnvironment(projectId, "production", "Production");

    const created = await app.request(`/v1/projects/${projectKey}/flags`, {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify({
        key: "checkout-v2",
        name: "Checkout v2",
        type: "boolean",
        tags: ["release"],
      }),
    });

    expect(created.status).toBe(201);
    const detail = (await created.json()) as FlagDetail;

    expect(detail.environments).toHaveLength(2);
    expect(detail.environments.every((entry) => !entry.enabled)).toBe(true);
    expect(
      detail.environments.find((entry) => entry.environmentKey === "staging")
        ?.variations,
    ).toHaveLength(2);

    const published = await app.request(
      `/v1/projects/${projectKey}/flags/checkout-v2/environments/staging`,
      {
        method: "PATCH",
        headers: headers(session),
        body: JSON.stringify({
          enabled: true,
          offVariation: "off",
          defaultVariation: "on",
          rolloutPercentage: 50,
          bucketBy: "userId",
          variations: VARIATIONS,
        }),
      },
    );

    expect(published.status).toBe(200);
    await expect(published.json()).resolves.toMatchObject({
      environmentKey: "staging",
      enabled: true,
      rolloutPercentage: 50,
    });

    // The whole point of the flag/configuration split.
    const production = await app.request(
      `/v1/projects/${projectKey}/flags/checkout-v2/environments/production`,
      { headers: { cookie: session.cookie } },
    );

    await expect(production.json()).resolves.toMatchObject({
      environmentKey: "production",
      enabled: false,
      rolloutPercentage: 0,
    });

    const { db } = await import("../../db/client.js");
    const { auditLog, flagVersion } = await import("../../db/schema/index.js");

    const audits = await db.select().from(auditLog);
    expect(audits.map((row) => row.action).sort()).toEqual([
      "flag.created",
      "flag.enabled",
    ]);
    expect(audits.every((row) => row.organizationId === organizationId)).toBe(
      true,
    );
    expect(audits.find((row) => row.action === "flag.enabled")?.environmentId).toBe(
      staging,
    );

    await expect(db.select().from(flagVersion)).resolves.toHaveLength(2);
  });

  it("answers a project in another workspace with 404", async () => {
    const { projectKey } = await ownerFixture();
    const outsider = await signUp(app);
    await seedWorkspace(outsider.userId, "owner");

    const response = await app.request(`/v1/projects/${projectKey}/flags`, {
      headers: { cookie: outsider.cookie },
    });

    expect(response.status).toBe(404);
  });

  it("lets a viewer read but not write", async () => {
    const { session, organizationId, projectKey, projectId } =
      await ownerFixture();
    await seedEnvironment(projectId, "staging", "Staging");

    const viewer = await signUp(app);
    await seedProjectMember(projectId, viewer.userId, "viewer");
    const { db } = await import("../../db/client.js");
    const { member } = await import("../../db/schema/index.js");
    await db
      .insert(member)
      .values({
        id: randomUUID(),
        organizationId,
        userId: viewer.userId,
        role: "member",
      });

    const created = await app.request(`/v1/projects/${projectKey}/flags`, {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify({ key: "beta", name: "Beta", type: "boolean" }),
    });
    expect(created.status).toBe(201);

    const list = await app.request(`/v1/projects/${projectKey}/flags`, {
      headers: { cookie: viewer.cookie },
    });
    expect(list.status).toBe(200);

    const write = await app.request(
      `/v1/projects/${projectKey}/flags/beta/environments/staging`,
      {
        method: "PATCH",
        headers: headers(viewer),
        body: JSON.stringify({
          enabled: true,
          offVariation: "off",
          defaultVariation: "on",
          rolloutPercentage: 0,
          bucketBy: "userId",
          variations: VARIATIONS,
        }),
      },
    );
    expect(write.status).toBe(403);
  });

  it("refuses a duplicate flag key with 409", async () => {
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "staging", "Staging");

    const body = JSON.stringify({ key: "beta", name: "Beta", type: "boolean" });

    const first = await app.request(`/v1/projects/${projectKey}/flags`, {
      method: "POST",
      headers: headers(session),
      body,
    });
    expect(first.status).toBe(201);

    const second = await app.request(`/v1/projects/${projectKey}/flags`, {
      method: "POST",
      headers: headers(session),
      body,
    });

    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({
      error: { code: "conflict" },
    });
  });

  it("rejects a variation that the environment does not define", async () => {
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "staging", "Staging");

    await app.request(`/v1/projects/${projectKey}/flags`, {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify({ key: "beta", name: "Beta", type: "boolean" }),
    });

    const response = await app.request(
      `/v1/projects/${projectKey}/flags/beta/environments/staging`,
      {
        method: "PATCH",
        headers: headers(session),
        body: JSON.stringify({
          enabled: true,
          offVariation: "off",
          defaultVariation: "missing",
          rolloutPercentage: 0,
          bucketBy: "userId",
          variations: VARIATIONS,
        }),
      },
    );

    expect(response.status).toBe(400);
  });

  it("filters the list by search and status", async () => {
    const { session, projectKey } = await ownerFixture();

    for (const [key, name] of [
      ["checkout-v2", "Checkout v2"],
      ["search-bar", "Search bar"],
    ] as const) {
      await app.request(`/v1/projects/${projectKey}/flags`, {
        method: "POST",
        headers: headers(session),
        body: JSON.stringify({ key, name, type: "boolean" }),
      });
    }

    const searched = await app.request(
      `/v1/projects/${projectKey}/flags?search=checkout`,
      { headers: { cookie: session.cookie } },
    );
    const body = (await searched.json()) as { data: FlagDetail[] };

    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.key).toBe("checkout-v2");

    await app.request(`/v1/projects/${projectKey}/flags/search-bar`, {
      method: "DELETE",
      headers: { cookie: session.cookie },
    });

    const active = await app.request(
      `/v1/projects/${projectKey}/flags?status=active`,
      { headers: { cookie: session.cookie } },
    );
    const archived = await app.request(
      `/v1/projects/${projectKey}/flags?status=archived`,
      { headers: { cookie: session.cookie } },
    );

    await expect(active.json()).resolves.toMatchObject({
      data: [expect.objectContaining({ key: "checkout-v2" })],
    });
    await expect(archived.json()).resolves.toMatchObject({
      data: [expect.objectContaining({ key: "search-bar" })],
    });
  });
});
