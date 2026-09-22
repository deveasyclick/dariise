import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { ApiKey, CreatedApiKey } from "@dariise/contracts";

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

interface Fixture {
  session: TestSession;
  organizationId: string;
  projectKey: string;
  projectId: string;
}

async function fixture(): Promise<Fixture> {
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

async function issueKey(
  fixtureUnderTest: Fixture,
  body: Record<string, unknown> = {},
): Promise<CreatedApiKey> {
  const response = await app.request(
    `/v1/projects/${fixtureUnderTest.projectKey}/api-keys`,
    {
      method: "POST",
      headers: headers(fixtureUnderTest.session),
      body: JSON.stringify({
        name: "CI pipeline",
        environmentKey: "development",
        scopes: ["flags:read"],
        expiresInDays: 30,
        ...body,
      }),
    },
  );

  expect(response.status).toBe(201);

  return (await response.json()) as CreatedApiKey;
}

describe("api-keys module", () => {
  it("returns the secret once and stores only its hash", async () => {
    const underTest = await fixture();
    const created = await issueKey(underTest);

    expect(created.secret).toContain(created.prefix);
    expect(created.environmentKey).toBe("development");
    expect(created.expiresAt).not.toBeNull();

    const { db } = await import("../../db/client.js");
    const { apiKey } = await import("../../db/schema/index.js");
    const [row] = await db.select().from(apiKey);

    expect(row?.secretHash).not.toBe(created.secret);
    expect(row?.secretHash).toHaveLength(64);
    expect(row?.prefix).toBe(created.prefix);

    const list = await app.request(
      `/v1/projects/${underTest.projectKey}/api-keys`,
      { headers: { cookie: underTest.session.cookie } },
    );
    const body = (await list.json()) as { data: ApiKey[] };

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).not.toHaveProperty("secret");
    expect(body.data[0]?.prefix).toBe(created.prefix);
  });

  it("hides revoked keys by default and returns them on request", async () => {
    const underTest = await fixture();
    const created = await issueKey(underTest);

    const revoked = await app.request(
      `/v1/projects/${underTest.projectKey}/api-keys/${created.id}`,
      { method: "DELETE", headers: { cookie: underTest.session.cookie } },
    );

    expect(revoked.status).toBe(200);
    const revokedBody = (await revoked.json()) as ApiKey;
    expect(revokedBody.revokedAt).not.toBeNull();

    const visible = await app.request(
      `/v1/projects/${underTest.projectKey}/api-keys`,
      { headers: { cookie: underTest.session.cookie } },
    );
    await expect(visible.json()).resolves.toMatchObject({ data: [] });

    const all = await app.request(
      `/v1/projects/${underTest.projectKey}/api-keys?includeRevoked=true`,
      { headers: { cookie: underTest.session.cookie } },
    );
    await expect(all.json()).resolves.toMatchObject({
      data: [expect.objectContaining({ id: created.id })],
    });
  });

  it("makes revocation idempotent without a second audit row", async () => {
    const underTest = await fixture();
    const created = await issueKey(underTest);

    const path = `/v1/projects/${underTest.projectKey}/api-keys/${created.id}`;

    const first = await app.request(path, {
      method: "DELETE",
      headers: { cookie: underTest.session.cookie },
    });
    const second = await app.request(path, {
      method: "DELETE",
      headers: { cookie: underTest.session.cookie },
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const firstBody = (await first.json()) as ApiKey;
    const secondBody = (await second.json()) as ApiKey;
    expect(secondBody.revokedAt).toBe(firstBody.revokedAt);

    const { db } = await import("../../db/client.js");
    const { auditLog } = await import("../../db/schema/index.js");
    const actions = (await db.select().from(auditLog)).map((row) => row.action);

    expect(actions.filter((action) => action === "api_key.revoked")).toHaveLength(
      1,
    );
    expect(actions).toContain("api_key.created");
  });

  it("rejects an environment key from another project", async () => {
    const underTest = await fixture();

    const other = await app.request("/v1/projects", {
      method: "POST",
      headers: headers(underTest.session),
      body: JSON.stringify({ name: "Other", environmentName: "Production" }),
    });
    expect(other.status).toBe(201);

    const foreign = await app.request(
      `/v1/projects/${underTest.projectKey}/api-keys`,
      {
        method: "POST",
        headers: headers(underTest.session),
        body: JSON.stringify({
          name: "Nope",
          environmentKey: "production",
          scopes: ["flags:read"],
        }),
      },
    );

    expect(foreign.status).toBe(400);

    const unknown = await app.request(
      `/v1/projects/${underTest.projectKey}/api-keys`,
      {
        method: "POST",
        headers: headers(underTest.session),
        body: JSON.stringify({
          name: "Nope",
          environmentKey: "staging",
          scopes: ["flags:read"],
        }),
      },
    );
    expect(unknown.status).toBe(400);

    // A workspace-wide key is still allowed.
    const created = await issueKey(underTest, { environmentKey: null });
    expect(created.environmentId).toBeNull();
    expect(created.environmentKey).toBeNull();
  });

  it("refuses a viewer, and hides another workspace's keys", async () => {
    const underTest = await fixture();
    const created = await issueKey(underTest);
    const { db } = await import("../../db/client.js");
    const { member, projectMember } = await import("../../db/schema/index.js");

    const viewer = await signUp(app);
    await db.insert(member).values({
      id: randomUUID(),
      organizationId: underTest.organizationId,
      userId: viewer.userId,
      role: "member",
    });
    await db.insert(projectMember).values({
      id: randomUUID(),
      projectId: underTest.projectId,
      userId: viewer.userId,
      role: "viewer",
    });

    const read = await app.request(
      `/v1/projects/${underTest.projectKey}/api-keys`,
      { headers: { cookie: viewer.cookie } },
    );
    expect(read.status).toBe(200);

    const issue = await app.request(
      `/v1/projects/${underTest.projectKey}/api-keys`,
      {
        method: "POST",
        headers: headers(viewer),
        body: JSON.stringify({ name: "Nope", scopes: ["flags:read"] }),
      },
    );
    expect(issue.status).toBe(403);

    const revoke = await app.request(
      `/v1/projects/${underTest.projectKey}/api-keys/${created.id}`,
      { method: "DELETE", headers: { cookie: viewer.cookie } },
    );
    expect(revoke.status).toBe(403);

    const outsider = await signUp(app);
    await seedWorkspace(outsider.userId, "owner");

    const foreign = await app.request(
      `/v1/projects/${underTest.projectKey}/api-keys`,
      { headers: { cookie: outsider.cookie } },
    );
    expect(foreign.status).toBe(404);
  });
});
