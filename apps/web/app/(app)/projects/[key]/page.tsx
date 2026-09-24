import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArchiveProjectCard,
  DefaultEnvironmentCard,
  ProjectEnvironmentsCard,
  ProjectFlagsCard,
  ProjectSummaryCard,
} from "@/components/app/projects/project-cards";
import { cappedCount } from "@/components/app/environments/capped-count";
import * as api from "@/lib/api";
import { loadProject } from "./load-project";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/projects/[key]">,
): Promise<Metadata> {
  const { key } = await props.params;
  const project = await loadProject(key);

  return {
    title: project ? `${project.name} · Projects` : "Project",
    description:
      "Environments, flags, and keys for this project, scoped to one workspace.",
  };
}

export default async function ProjectEnvironmentsPage(
  props: PageProps<"/projects/[key]">,
) {
  const { key } = await props.params;
  const project = await loadProject(key);

  if (!project) notFound();

  const [environmentPage, flagPage, apiKeyPage, segmentPage] =
    await Promise.all([
      api.environments.list(project.key),
      api.flags.list(project.key, { limit: 100 }),
      api.apiKeys.list(project.key),
      api.segments.list(project.key),
    ]);

  const environments = environmentPage.data;
  const flags = flagPage.data;
  const flagsTruncated = flagPage.nextCursor !== null;
  const defaultEnvironmentKey =
    environments.find(
      (environment) => environment.id === project.defaultEnvironmentId,
    )?.key ??
    environments.find((environment) => environment.isDefault)?.key ??
    environments[0]?.key ??
    null;

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <ProjectEnvironmentsCard
          environments={environments}
          flags={flags}
          flagsTruncated={flagsTruncated}
        />
        <ProjectFlagsCard
          projectKey={project.key}
          flags={flags}
          environments={environments}
          defaultEnvironmentKey={defaultEnvironmentKey}
          limit={4}
          truncated={flagsTruncated}
        />
      </div>

      <div className="space-y-3">
        <ProjectSummaryCard
          project={project}
          flagCount={cappedCount(flagPage)}
          segmentCount={cappedCount(segmentPage)}
          apiKeyCount={cappedCount(apiKeyPage)}
        />
        <DefaultEnvironmentCard
          environments={environments}
          flags={flags}
          flagsTruncated={flagsTruncated}
          defaultEnvironmentKey={defaultEnvironmentKey}
        />
        <ArchiveProjectCard />
      </div>
    </div>
  );
}
