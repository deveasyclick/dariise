import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type {
  ApiKey,
  EnvironmentDetail,
  EnvironmentSummary,
  FlagDetail,
  SegmentDetail,
  SegmentSummary,
  WorkspaceProfile,
} from "@dariise/contracts";

import {
  closeTestDatabase,
  loadApp,
  loadTestEnv,
  resetTestDatabase,
  seedWorkspace,
  signUp,
  truncateAll,
  type TestSession,
} from "./harness.js";

/**
 * The route-level edges and pagination the colocated module suites do not reach:
 * identity updates, list paging for the remaining collections, the compound
 * project create's key de-duplication and the defensive metadata parse.
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

function headers(session: TestSession): Record<string, string> {
  return { "content-type": "application/json", cookie: session.cookie };
}

interface Fixture {
  session: TestSession;
  organizationId: string;
  projectKey: string;
}

async function fixture(projectName = "Checkout Platform"): Promise<Fixture> {
  const session = await signUp(app);
  const workspace = await seedWorkspace(session.userId, "owner");

  const created = await app.request("/v1/projects", {
    method: "POST",
    headers: headers(session),
    body: JSON.stringify({ name: projectName, environmentName: "Development" }),
  });
  expect(created.status).toBe(201);
  const project = (await created.json()) as { key: string };

  return {
    session,
    organizationId: workspace.organizationId,
    projectKey: project.key,
  };
}

async function createFlag(
  underTest: Fixture,
  key: string,
): Promise<FlagDetail> {
  const response = await app.request(
    `/v1/projects/${underTest.projectKey}/flags`,
    {
      method: "POST",
      headers: headers(underTest.session),
      body: JSON.stringify({ key, name: key, type: "boolean" }),
    },
  );
  expect(response.status).toBe(201);

  return (await response.json()) as FlagDetail;
}

async function createSegment(
  underTest: Fixture,
  key: string,
): Promise<SegmentDetail> {
  const response = await app.request(
    `/v1/projects/${underTest.projectKey}/segments`,
    {
      method: "POST",
      headers: headers(underTest.session),
      body: JSON.stringify({ name: key, key, rules: [] }),
    },
  );
  expect(response.status).toBe(201);

  return (await response.json()) as SegmentDetail;
}

describe("route coverage: flag identity", () => {
  it("updates a flag's identity without touching its configuration", async () => {
    const underTest = await fixture();
    await createFlag(underTest, "checkout-v2");

    const response = await app.request(
      `/v1/projects/${underTest.projectKey}/flags/checkout-v2`,
      {
        method: "PATCH",
        headers: headers(underTest.session),
        body: JSON.stringify({
          name: "Checkout v2 (renamed)",
          description: "Now with a description",
          tags: ["release", "payments"],
          owner: "platform",
        }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      key: "checkout-v2",
      name: "Checkout v2 (renamed)",
      description: "Now with a description",
      tags: ["release", "payments"],
      owner: "platform",
      // The per-environment state is untouched by an identity update.
      environments: [
        expect.objectContaining({ environmentKey: "development", enabled: false }),
      ],
    });

    const { db } = await import("../db/client.js");
    const { auditLog } = await import("../db/schema/index.js");
    const actions = (await db.select().from(auditLog)).map((row) => row.action);

    expect(actions.filter((action) => action === "flag.updated")).toHaveLength(1);
  });

  it("answers an unknown environment with 404 rather than an empty config", async () => {
    const underTest = await fixture();
    await createFlag(underTest, "checkout-v2");

    const response = await app.request(
      `/v1/projects/${underTest.projectKey}/flags/checkout-v2/environments/nope`,
      { headers: { cookie: underTest.session.cookie } },
    );

    expect(response.status).toBe(404);
  });

  it("refuses an archive by a viewer", async () => {
    const underTest = await fixture();
    await createFlag(underTest, "checkout-v2");

    const viewer = await signUp(app);
    const { db } = await import("../db/client.js");
    const { member, projectMember, project } = await import(
      "../db/schema/index.js"
    );
    const { eq } = await import("drizzle-orm");
    const [row] = await db
      .select()
      .from(project)
      .where(eq(project.key, underTest.projectKey));

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: underTest.organizationId,
      userId: viewer.userId,
      role: "member",
    });
    await db.insert(projectMember).values({
      id: crypto.randomUUID(),
      projectId: row?.id ?? "",
      userId: viewer.userId,
      role: "viewer",
    });

    const response = await app.request(
      `/v1/projects/${underTest.projectKey}/flags/checkout-v2`,
      { method: "DELETE", headers: { cookie: viewer.cookie } },
    );

    expect(response.status).toBe(403);
  });
});

describe("route coverage: segment identity", () => {
  it("renames a segment and replaces its conditions", async () => {
    const underTest = await fixture();
    await createSegment(underTest, "beta-users");

    const response = await app.request(
      `/v1/projects/${underTest.projectKey}/segments/beta-users`,
      {
        method: "PATCH",
        headers: headers(underTest.session),
        body: JSON.stringify({
          name: "Beta users (v2)",
          rules: [
            {
              attribute: "plan",
              attributeType: "string",
              operator: "equals",
              values: ["beta"],
            },
          ],
        }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      key: "beta-users",
      name: "Beta users (v2)",
      conditions: [
        { attribute: "plan", operator: "equals", values: ["beta"] },
      ],
    });

    const list = await app.request(
      `/v1/projects/${underTest.projectKey}/segments`,
      { headers: { cookie: underTest.session.cookie } },
    );
    await expect(list.json()).resolves.toMatchObject({
      data: [{ key: "beta-users", conditionCount: 1 }],
    });
  });

  it("answers an unknown segment with 404", async () => {
    const underTest = await fixture();

    const response = await app.request(
      `/v1/projects/${underTest.projectKey}/segments/nope`,
      { headers: { cookie: underTest.session.cookie } },
    );

    expect(response.status).toBe(404);
  });
});

describe("route coverage: pagination for the remaining collections", () => {
  it("pages environments, segments and api keys one row at a time", async () => {
    const underTest = await fixture();

    await app.request(`/v1/projects/${underTest.projectKey}/environments`, {
      method: "POST",
      headers: headers(underTest.session),
      body: JSON.stringify({ name: "Staging", key: "staging" }),
    });

    await createSegment(underTest, "alpha-segment");
    await createSegment(underTest, "beta-segment");

    for (const name of ["First key", "Second key"]) {
      const created = await app.request(
        `/v1/projects/${underTest.projectKey}/api-keys`,
        {
          method: "POST",
          headers: headers(underTest.session),
          body: JSON.stringify({ name, scopes: ["flags:read"] }),
        },
      );
      expect(created.status).toBe(201);
    }

    async function walk<T>(
      path: string,
      keyOf: (item: T) => string,
    ): Promise<string[]> {
      const seen: string[] = [];
      let cursor: string | null = null;

      do {
        const query = cursor === null ? "?limit=1" : `?limit=1&cursor=${encodeURIComponent(cursor)}`;
        const response = await app.request(`${path}${query}`, {
          headers: { cookie: underTest.session.cookie },
        });
        expect(response.status).toBe(200);

        const page = (await response.json()) as {
          data: T[];
          nextCursor: string | null;
        };

        seen.push(...page.data.map(keyOf));
        cursor = page.nextCursor;

        // A paging loop that never terminates would hang the suite.
        expect(seen.length).toBeLessThanOrEqual(10);
      } while (cursor !== null);

      return seen;
    }

    const environments = await walk<EnvironmentSummary>(
      `/v1/projects/${underTest.projectKey}/environments`,
      (environment) => environment.key,
    );
    const segments = await walk<SegmentSummary>(
      `/v1/projects/${underTest.projectKey}/segments`,
      (segment) => segment.key,
    );
    const keys = await walk<ApiKey>(
      `/v1/projects/${underTest.projectKey}/api-keys`,
      (key) => key.id,
    );

    expect(environments).toEqual(["development", "staging"]);
    expect(segments).toEqual(["alpha-segment", "beta-segment"]);
    expect(new Set(keys).size).toBe(2);
  });
});

describe("route coverage: compound project create", () => {
  it("de-duplicates the derived key instead of failing", async () => {
    const underTest = await fixture("Alpha Platform");

    const second = await app.request("/v1/projects", {
      method: "POST",
      headers: headers(underTest.session),
      body: JSON.stringify({
        name: "Alpha Platform",
        environmentName: "Production",
      }),
    });

    expect(second.status).toBe(201);
    await expect(second.json()).resolves.toMatchObject({
      key: "alpha-platform-2",
      name: "Alpha Platform",
    });

    const list = await app.request("/v1/projects", {
      headers: { cookie: underTest.session.cookie },
    });
    const projects = (await list.json()) as Array<{ key: string }>;

    expect(projects.map((project) => project.key)).toEqual([
      "alpha-platform",
      "alpha-platform-2",
    ]);

    // Each project still gets its own first environment.
    const environments = await app.request(
      `/v1/projects/alpha-platform-2/environments`,
      { headers: { cookie: underTest.session.cookie } },
    );
    await expect(environments.json()).resolves.toMatchObject({
      data: [expect.objectContaining({ name: "Production", isDefault: true })],
    });
  });
});

describe("route coverage: environment seeding modes", () => {
  it("seeds an environment with every flag already on", async () => {
    const underTest = await fixture();
    await createFlag(underTest, "checkout-v2");

    const created = await app.request(
      `/v1/projects/${underTest.projectKey}/environments`,
      {
        method: "POST",
        headers: headers(underTest.session),
        body: JSON.stringify({
          name: "QA",
          key: "qa",
          initialFlagStatus: "all-on",
        }),
      },
    );
    expect(created.status).toBe(201);

    const detail = (await created.json()) as EnvironmentDetail;
    expect(detail.settings.protectedEnvironment).toBe(false);

    const flag = await app.request(
      `/v1/projects/${underTest.projectKey}/flags/checkout-v2`,
      { headers: { cookie: underTest.session.cookie } },
    );
    const body = (await flag.json()) as FlagDetail;
    const qa = body.environments.find((entry) => entry.environmentKey === "qa");

    expect(qa).toMatchObject({ enabled: true, rolloutPercentage: 0 });
    expect(qa?.variations.map((variation) => variation.key)).toEqual([
      "on",
      "off",
    ]);
  });
});

describe("route coverage: audit range filters", () => {
  it("honours from and to", async () => {
    const underTest = await fixture();

    const past = new Date(Date.now() - 60_000).toISOString();
    const future = new Date(Date.now() + 60_000).toISOString();

    const within = await app.request(
      `/v1/projects/${underTest.projectKey}/audit-logs?from=${encodeURIComponent(past)}&to=${encodeURIComponent(future)}`,
      { headers: { cookie: underTest.session.cookie } },
    );
    const after = await app.request(
      `/v1/projects/${underTest.projectKey}/audit-logs?from=${encodeURIComponent(future)}`,
      { headers: { cookie: underTest.session.cookie } },
    );

    await expect(within.json()).resolves.toMatchObject({
      data: [expect.objectContaining({ action: "project.created" })],
    });
    await expect(after.json()).resolves.toMatchObject({ data: [] });
  });
});

describe("route coverage: defensive reads", () => {
  it("falls back to defaults when the workspace metadata is not JSON", async () => {
    const underTest = await fixture();
    const { db } = await import("../db/client.js");
    const { organization } = await import("../db/schema/index.js");
    const { eq } = await import("drizzle-orm");

    await db
      .update(organization)
      .set({ metadata: "this is not json" })
      .where(eq(organization.id, underTest.organizationId));

    const profile = await app.request("/v1/workspace", {
      headers: { cookie: underTest.session.cookie },
    });
    const security = await app.request("/v1/workspace/security", {
      headers: { cookie: underTest.session.cookie },
    });

    expect(profile.status).toBe(200);
    const body = (await profile.json()) as WorkspaceProfile;
    expect(body.timezone).toBe("UTC");
    expect(body.defaultEnvironmentId).toBeNull();

    await expect(security.json()).resolves.toMatchObject({
      sessionTimeout: "24h",
      auditRetentionDays: 90,
    });
  });
});
