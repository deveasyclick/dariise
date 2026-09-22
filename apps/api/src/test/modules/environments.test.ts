import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { EnvironmentDetail, FlagDetail } from "@dariise/contracts";

import {
  closeTestDatabase,
  loadApp,
  loadTestEnv,
  resetTestDatabase,
  seedWorkspace,
  signUp,
  truncateAll,
  type TestSession,
} from "../harness.js";

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

function headers(session: TestSession): Record<string, string> {
  return { "content-type": "application/json", cookie: session.cookie };
}

async function ownerWithProject(): Promise<{
  session: TestSession;
  organizationId: string;
  projectKey: string;
  projectId: string;
}> {
  const session = await signUp(app);
  const workspace = await seedWorkspace(session.userId, "owner");

  const created = await app.request("/v1/projects", {
    method: "POST",
    headers: headers(session),
    body: JSON.stringify({
      name: "Checkout Platform",
      environmentName: "Development",
    }),
  });

  const project = (await created.json()) as { id: string; key: string };

  return {
    session,
    organizationId: workspace.organizationId,
    projectKey: project.key,
    projectId: project.id,
  };
}

const VARIATIONS = [
  { key: "on", name: "On", value: true, description: null },
  { key: "off", name: "Off", value: false, description: null },
];

describe("environments module", () => {
  it("creates the project's first environment during onboarding", async () => {
    const { session, projectKey } = await ownerWithProject();

    const response = await app.request(
      `/v1/projects/${projectKey}/environments`,
      { headers: { cookie: session.cookie } },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Array<{ key: string; name: string; isDefault: boolean }>;
      nextCursor: string | null;
    };

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      key: "development",
      name: "Development",
      isDefault: true,
    });
  });

  it("copies or clears flag configuration according to initialFlagStatus", async () => {
    const { session, projectKey } = await ownerWithProject();

    await app.request(`/v1/projects/${projectKey}/flags`, {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify({ key: "checkout-v2", name: "Checkout v2", type: "boolean" }),
    });

    await app.request(
      `/v1/projects/${projectKey}/flags/checkout-v2/environments/development`,
      {
        method: "PATCH",
        headers: headers(session),
        body: JSON.stringify({
          enabled: true,
          offVariation: "off",
          defaultVariation: "on",
          rolloutPercentage: 100,
          bucketBy: "userId",
          variations: VARIATIONS,
        }),
      },
    );

    const copied = await app.request(`/v1/projects/${projectKey}/environments`, {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify({
        name: "Production",
        key: "production",
        copyFrom: "development",
        initialFlagStatus: "copy-source",
      }),
    });
    expect(copied.status).toBe(201);

    const cleared = await app.request(`/v1/projects/${projectKey}/environments`, {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify({
        name: "Staging",
        key: "staging",
        copyFrom: "development",
        initialFlagStatus: "all-off",
      }),
    });
    expect(cleared.status).toBe(201);

    const detail = await app.request(
      `/v1/projects/${projectKey}/flags/checkout-v2`,
      { headers: { cookie: session.cookie } },
    );
    const flag = (await detail.json()) as FlagDetail;

    const byKey = Object.fromEntries(
      flag.environments.map((entry) => [entry.environmentKey, entry]),
    );

    expect(byKey.development?.enabled).toBe(true);
    expect(byKey.production?.enabled).toBe(true);
    expect(byKey.staging?.enabled).toBe(false);
    // Copying carries the rollout, clearing does not.
    expect(byKey.production?.rolloutPercentage).toBe(100);
    expect(byKey.staging?.rolloutPercentage).toBe(0);
  });

  it("refuses a duplicate environment key with 409", async () => {
    const { session, projectKey } = await ownerWithProject();

    const response = await app.request(`/v1/projects/${projectKey}/environments`, {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify({ name: "Development again", key: "development" }),
    });

    expect(response.status).toBe(409);
  });

  it("updates settings, writes one audit row and returns the connection", async () => {
    const { session, projectKey } = await ownerWithProject();

    const response = await app.request(
      `/v1/projects/${projectKey}/environments/development/settings`,
      {
        method: "PATCH",
        headers: headers(session),
        body: JSON.stringify({
          protectedEnvironment: true,
          requireApprovals: true,
          singleUseSdkKeys: false,
        }),
      },
    );

    expect(response.status).toBe(200);
    const detail = (await response.json()) as EnvironmentDetail;

    expect(detail.settings).toEqual({
      protectedEnvironment: true,
      requireApprovals: true,
      singleUseSdkKeys: false,
    });
    expect(detail.isProtected).toBe(true);
    expect(detail.connection.evalUrl).toMatch(/\/v1\/evaluate$/);
    // Streaming and keys do not exist yet, so neither is advertised.
    expect(detail.connection.streamUrl).toBeNull();
    expect(detail.connection.maskedKey).toBeNull();

    const { db } = await import("../../db/client.js");
    const { auditLog } = await import("../../db/schema/index.js");
    const audits = await db.select().from(auditLog);

    expect(audits.map((row) => row.action).sort()).toEqual([
      "environment.updated",
      "project.created",
    ]);
  });

  it("reports coverage per environment, including a partial rollout", async () => {
    const { session, projectKey } = await ownerWithProject();

    await app.request(`/v1/projects/${projectKey}/flags`, {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify({ key: "checkout-v2", name: "Checkout v2", type: "boolean" }),
    });

    await app.request(
      `/v1/projects/${projectKey}/flags/checkout-v2/environments/development`,
      {
        method: "PATCH",
        headers: headers(session),
        body: JSON.stringify({
          enabled: true,
          offVariation: "off",
          defaultVariation: "on",
          rolloutPercentage: 25,
          bucketBy: "userId",
          variations: VARIATIONS,
        }),
      },
    );

    await app.request(`/v1/projects/${projectKey}/environments`, {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify({ name: "Production", key: "production" }),
    });

    const response = await app.request(`/v1/projects/${projectKey}/coverage`, {
      headers: { cookie: session.cookie },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: [
        {
          key: "checkout-v2",
          states: {
            development: { kind: "percentage", percentage: 25 },
            production: { kind: "off" },
          },
        },
      ],
      nextCursor: null,
    });
  });

  it("lets a viewer read but not create, and hides other workspaces", async () => {
    const { organizationId, projectKey, projectId } =
      await ownerWithProject();
    const { db } = await import("../../db/client.js");
    const { member, projectMember } = await import("../../db/schema/index.js");

    // Same workspace, explicit viewer role on this project.
    const viewer = await signUp(app);
    await db.insert(member).values({
      id: randomUUID(),
      organizationId,
      userId: viewer.userId,
      role: "member",
    });
    await db.insert(projectMember).values({
      id: randomUUID(),
      projectId,
      userId: viewer.userId,
      role: "viewer",
    });

    const read = await app.request(`/v1/projects/${projectKey}/environments`, {
      headers: { cookie: viewer.cookie },
    });
    expect(read.status).toBe(200);

    const write = await app.request(`/v1/projects/${projectKey}/environments`, {
      method: "POST",
      headers: headers(viewer),
      body: JSON.stringify({ name: "Nope", key: "nope" }),
    });
    expect(write.status).toBe(403);

    const outsider = await signUp(app);
    await seedWorkspace(outsider.userId, "owner");

    const foreign = await app.request(
      `/v1/projects/${projectKey}/environments`,
      { headers: { cookie: outsider.cookie } },
    );
    expect(foreign.status).toBe(404);
  });
});
