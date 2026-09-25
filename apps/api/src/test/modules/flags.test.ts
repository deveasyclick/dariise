import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { FlagDetail, FlagSummary } from "@dariise/contracts";

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

/** A flag is addressed inside the environment it belongs to. */
function flagPath(projectKey: string, environmentKey: string, flagKey: string) {
  return `/v1/projects/${projectKey}/environments/${environmentKey}/flags/${flagKey}`;
}

function createFlag(
  projectKey: string,
  session: TestSession,
  body: Record<string, unknown>,
) {
  return app.request(`/v1/projects/${projectKey}/flags`, {
    method: "POST",
    headers: headers(session),
    body: JSON.stringify({ tags: [], ...body }),
  });
}

describe("flags module", () => {
  it("creates the flag with the values the caller chose", async () => {
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "development", "Development");

    const created = await createFlag(projectKey, session, {
      environmentKey: "development",
      key: "greeting",
      name: "Greeting",
      type: "string",
      values: { on: "hello", off: "goodbye" },
    });

    expect(created.status).toBe(201);
    const detail = (await created.json()) as FlagDetail;

    expect(detail.environmentKey).toBe("development");
    expect(
      detail.variations.find((variation) => variation.key === "on")?.value,
    ).toBe("hello");
    expect(
      detail.variations.find((variation) => variation.key === "off")?.value,
    ).toBe("goodbye");
  });

  it("refuses creation in an environment the project does not have", async () => {
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "development", "Development");

    const created = await createFlag(projectKey, session, {
      environmentKey: "production",
      key: "greeting",
      name: "Greeting",
      type: "string",
    });

    expect(created.status).toBe(404);
  });

  it("refuses creation when a chosen value is not the declared type", async () => {
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "development", "Development");

    const created = await createFlag(projectKey, session, {
      environmentKey: "development",
      key: "greeting",
      name: "Greeting",
      type: "string",
      values: { on: true, off: "goodbye" },
    });

    expect(created.status).toBe(400);
    await expect(created.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });

    // Nothing was written, so the key is still free.
    const retried = await createFlag(projectKey, session, {
      environmentKey: "development",
      key: "greeting",
      name: "Greeting",
      type: "string",
      values: { on: "hello", off: "goodbye" },
    });
    expect(retried.status).toBe(201);
  });

  it("starts a flag with values of its declared type", async () => {
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "development", "Development");

    const seeded = async (key: string, type: string) => {
      const response = await createFlag(projectKey, session, {
        environmentKey: "development",
        key,
        name: key,
        type,
      });

      expect(response.status).toBe(201);
      const detail = (await response.json()) as FlagDetail;

      return {
        on: detail.variations.find((variation) => variation.key === "on")
          ?.value,
        off: detail.variations.find((variation) => variation.key === "off")
          ?.value,
      };
    };

    // The point of the type: a string flag serves strings from its first
    // evaluation, rather than the boolean pair every flag used to get.
    expect(await seeded("greeting", "string")).toEqual({
      on: "on",
      off: "off",
    });
    expect(await seeded("retries", "number")).toEqual({ on: 1, off: 0 });
    expect(await seeded("enabled", "boolean")).toEqual({ on: true, off: false });

    const asJson = await seeded("payload", "json");
    expect(typeof asJson.on).toBe("object");
    expect(typeof asJson.off).toBe("object");
  });

  it("refuses a variation value that is not the flag's declared type", async () => {
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "development", "Development");

    const created = await createFlag(projectKey, session, {
      environmentKey: "development",
      key: "greeting",
      name: "Greeting",
      type: "string",
    });
    expect(created.status).toBe(201);

    const publish = (value: unknown) =>
      app.request(`${flagPath(projectKey, "development", "greeting")}/config`, {
        method: "PATCH",
        headers: headers(session),
        body: JSON.stringify({
          enabled: true,
          offVariation: "off",
          defaultVariation: "on",
          rolloutPercentage: 0,
          bucketBy: "userId",
          variations: [
            { key: "on", name: "On", value, description: null },
            { key: "off", name: "Off", value: "off", description: null },
          ],
        }),
      });

    const rejected = await publish(true);
    expect(rejected.status).toBe(400);
    await expect(rejected.json()).resolves.toMatchObject({
      error: { code: "invalid_request" },
    });

    // A matching value goes through, so the rule is the type and not a blanket
    // refusal of the endpoint.
    expect((await publish("hello")).status).toBe(200);
  });

  it("keeps configuration per environment and records one audit row per mutation", async () => {
    const { session, organizationId, projectKey, projectId } =
      await ownerFixture();

    const staging = await seedEnvironment(projectId, "staging", "Staging");
    await seedEnvironment(projectId, "production", "Production");

    const created = await createFlag(projectKey, session, {
      environmentKey: "staging",
      key: "checkout-v2",
      name: "Checkout v2",
      type: "boolean",
      tags: ["release"],
    });

    expect(created.status).toBe(201);

    // The flag was created in staging, so it exists in staging alone.
    const elsewhere = await app.request(
      flagPath(projectKey, "production", "checkout-v2"),
      { headers: { cookie: session.cookie } },
    );
    expect(elsewhere.status).toBe(404);

    const published = await app.request(
      `${flagPath(projectKey, "staging", "checkout-v2")}/config`,
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
      variations: VARIATIONS,
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
    expect(
      audits.find((row) => row.action === "flag.enabled")?.environmentId,
    ).toBe(staging);

    await expect(db.select().from(flagVersion)).resolves.toHaveLength(2);
  });

  it("copies a flag into another environment when it is promoted", async () => {
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "staging", "Staging");
    const production = await seedEnvironment(
      projectId,
      "production",
      "Production",
    );

    await createFlag(projectKey, session, {
      environmentKey: "staging",
      key: "checkout-v2",
      name: "Checkout v2",
      type: "boolean",
    });

    await app.request(`${flagPath(projectKey, "staging", "checkout-v2")}/config`, {
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
    });

    const promoted = await app.request(
      `${flagPath(projectKey, "staging", "checkout-v2")}/promote`,
      {
        method: "POST",
        headers: headers(session),
        body: JSON.stringify({ to: "production" }),
      },
    );

    expect(promoted.status).toBe(201);
    const copy = (await promoted.json()) as FlagDetail;

    // A promotion is a copy of the whole flag, not a link between the two.
    expect(copy.environmentKey).toBe("production");
    expect(copy.key).toBe("checkout-v2");
    expect(copy.enabled).toBe(true);
    expect(copy.rolloutPercentage).toBe(25);
    expect(copy.variations).toEqual(VARIATIONS);

    // The two are independent from here on.
    await app.request(
      `${flagPath(projectKey, "staging", "checkout-v2")}/config`,
      {
        method: "PATCH",
        headers: headers(session),
        body: JSON.stringify({
          enabled: false,
          offVariation: "off",
          defaultVariation: "on",
          rolloutPercentage: 0,
          bucketBy: "userId",
          variations: VARIATIONS,
        }),
      },
    );

    const productionDetail = await app.request(
      flagPath(projectKey, "production", "checkout-v2"),
      { headers: { cookie: session.cookie } },
    );
    await expect(productionDetail.json()).resolves.toMatchObject({
      environmentKey: "production",
      enabled: true,
      rolloutPercentage: 25,
    });

    const { db } = await import("../../db/client.js");
    const { auditLog } = await import("../../db/schema/index.js");
    const promotion = (await db.select().from(auditLog)).find(
      (row) => row.action === "flag.promoted",
    );

    expect(promotion?.environmentId).toBe(production);
  });

  it("refuses to promote onto an existing key with 409", async () => {
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "staging", "Staging");
    await seedEnvironment(projectId, "production", "Production");

    for (const environmentKey of ["staging", "production"]) {
      await createFlag(projectKey, session, {
        environmentKey,
        key: "checkout-v2",
        name: "Checkout v2",
        type: "boolean",
      });
    }

    const promoted = await app.request(
      `${flagPath(projectKey, "staging", "checkout-v2")}/promote`,
      {
        method: "POST",
        headers: headers(session),
        body: JSON.stringify({ to: "production" }),
      },
    );

    expect(promoted.status).toBe(409);
  });

  it("answers a project in another workspace with 404", async () => {
    const { projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "development", "Development");
    const outsider = await signUp(app);
    await seedWorkspace(outsider.userId, "owner");

    const response = await app.request(
      `/v1/projects/${projectKey}/flags?environmentKey=development`,
      { headers: { cookie: outsider.cookie } },
    );

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

    const created = await createFlag(projectKey, session, {
      environmentKey: "staging",
      key: "beta",
      name: "Beta",
      type: "boolean",
    });
    expect(created.status).toBe(201);

    const list = await app.request(
      `/v1/projects/${projectKey}/flags?environmentKey=staging`,
      { headers: { cookie: viewer.cookie } },
    );
    expect(list.status).toBe(200);

    const write = await app.request(
      `${flagPath(projectKey, "staging", "beta")}/config`,
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
    await seedEnvironment(projectId, "production", "Production");

    const body = {
      key: "beta",
      name: "Beta",
      type: "boolean",
    };

    const first = await createFlag(projectKey, session, {
      ...body,
      environmentKey: "staging",
    });
    expect(first.status).toBe(201);

    // The key is unique within an environment, not within the project.
    const elsewhere = await createFlag(projectKey, session, {
      ...body,
      environmentKey: "production",
    });
    expect(elsewhere.status).toBe(201);

    const second = await createFlag(projectKey, session, {
      ...body,
      environmentKey: "staging",
    });

    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({
      error: { code: "conflict" },
    });
  });

  it("rejects a variation that the environment does not define", async () => {
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "staging", "Staging");

    await createFlag(projectKey, session, {
      environmentKey: "staging",
      key: "beta",
      name: "Beta",
      type: "boolean",
    });

    const response = await app.request(
      `${flagPath(projectKey, "staging", "beta")}/config`,
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
    const { session, projectKey, projectId } = await ownerFixture();
    await seedEnvironment(projectId, "staging", "Staging");

    for (const [key, name] of [
      ["checkout-v2", "Checkout v2"],
      ["search-bar", "Search bar"],
    ] as const) {
      await createFlag(projectKey, session, {
        environmentKey: "staging",
        key,
        name,
        type: "boolean",
      });
    }

    const searched = await app.request(
      `/v1/projects/${projectKey}/flags?environmentKey=staging&search=checkout`,
      { headers: { cookie: session.cookie } },
    );
    const body = (await searched.json()) as { data: FlagSummary[] };

    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.key).toBe("checkout-v2");

    await app.request(flagPath(projectKey, "staging", "search-bar"), {
      method: "DELETE",
      headers: { cookie: session.cookie },
    });

    const active = await app.request(
      `/v1/projects/${projectKey}/flags?environmentKey=staging&status=active`,
      { headers: { cookie: session.cookie } },
    );
    const archived = await app.request(
      `/v1/projects/${projectKey}/flags?environmentKey=staging&status=archived`,
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
