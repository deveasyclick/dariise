import { describe, expect, it } from "vitest";

import type { ApiError } from "../../shared/http/errors.js";
import type { ProjectAccessRepository } from "../../modules/project-access/project-access.repository.js";
import { ProjectAccessService } from "../../modules/project-access/project-access.service.js";

function repositoryWith(options: {
  projectFound?: boolean;
  memberRole?: string | null;
}): ProjectAccessRepository {
  return {
    findProjectByKey: async () =>
      options.projectFound === false
        ? null
        : { id: "project-1", key: "checkout", name: "Checkout" },
    findMemberRole: async () => options.memberRole ?? null,
  } as unknown as ProjectAccessRepository;
}

async function failureOf(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }

  throw new Error("Expected the gate to refuse access, but it allowed it.");
}

const input = {
  organizationId: "org-1",
  projectKey: "checkout",
  userId: "user-1",
  minimumRole: "viewer" as const,
};

describe("ProjectAccessService", () => {
  it("treats a workspace owner as an implicit project owner", async () => {
    const service = new ProjectAccessService(
      repositoryWith({ memberRole: null }),
    );

    await expect(
      service.require({ ...input, workspaceRole: "owner", minimumRole: "owner" }),
    ).resolves.toMatchObject({ project: { key: "checkout" }, role: "owner" });
  });

  it("treats a plain workspace member with no project row as a non-member", async () => {
    const service = new ProjectAccessService(
      repositoryWith({ memberRole: null }),
    );

    const error = await failureOf(
      service.require({ ...input, workspaceRole: "member" }),
    );

    // 404, never 403: a 403 would confirm the project exists.
    expect(error.status).toBe(404);
    expect(error.code).toBe("not_found");
  });

  it("refuses a viewer who needs to write", async () => {
    const service = new ProjectAccessService(
      repositoryWith({ memberRole: "viewer" }),
    );

    const error = await failureOf(
      service.require({
        ...input,
        workspaceRole: "member",
        minimumRole: "engineer",
      }),
    );

    expect(error.status).toBe(403);
    expect(error.code).toBe("forbidden");
  });

  it("keeps the higher of the implicit and explicit roles", async () => {
    const service = new ProjectAccessService(
      repositoryWith({ memberRole: "owner" }),
    );

    await expect(
      service.require({
        ...input,
        workspaceRole: "member",
        minimumRole: "owner",
      }),
    ).resolves.toMatchObject({ role: "owner" });
  });

  it("answers a project it cannot see with 404 rather than 403", async () => {
    const service = new ProjectAccessService(
      repositoryWith({ projectFound: false }),
    );

    const error = await failureOf(
      service.require({ ...input, workspaceRole: "owner" }),
    );

    expect(error.status).toBe(404);
  });

  it("ignores an unrecognised stored role instead of granting it", async () => {
    const service = new ProjectAccessService(
      repositoryWith({ memberRole: "superuser" }),
    );

    const error = await failureOf(
      service.require({ ...input, workspaceRole: "member" }),
    );

    expect(error.status).toBe(404);
  });
});
