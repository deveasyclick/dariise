import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectFlagsCard } from "@/components/app/projects/project-cards";
import * as api from "@/lib/api";
import { loadProject } from "../load-project";

export const metadata: Metadata = {
  title: "Flags · Project",
  description: "Every flag in this project, with its environment and state.",
};

export const dynamic = "force-dynamic";

export default async function ProjectFlagsPage(
  props: PageProps<"/projects/[key]/flags">,
) {
  const { key } = await props.params;
  const project = await loadProject(key);

  if (!project) notFound();

  const [environmentPage, flagPage] = await Promise.all([
    api.environments.list(project.key),
    api.flags.list(project.key, { limit: 100 }),
  ]);

  const environments = environmentPage.data;
  const defaultEnvironmentKey =
    environments.find(
      (environment) => environment.id === project.defaultEnvironmentId,
    )?.key ??
    environments.find((environment) => environment.isDefault)?.key ??
    environments[0]?.key ??
    null;

  return (
    <div className="mx-auto max-w-3xl">
      <ProjectFlagsCard
        projectKey={project.key}
        flags={flagPage.data}
        environments={environments}
        defaultEnvironmentKey={defaultEnvironmentKey}
        truncated={flagPage.nextCursor !== null}
      />
    </div>
  );
}
