import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectFlagsCard } from "@/components/app/projects/project-cards";
import { listProjectFlags } from "@/components/app/flags/flag-queries";
import * as api from "@/lib/api";
import { loadProject } from "../load-project";

export const metadata: Metadata = {
  title: "Flags · Project",
  description: "Every flag in this project, with its state in each environment.",
};

export const dynamic = "force-dynamic";

export default async function ProjectFlagsPage(
  props: PageProps<"/projects/[key]/flags">,
) {
  const { key } = await props.params;
  const project = await loadProject(key);

  if (!project) notFound();

  // One list call for the project: flags are project-scoped, and each row
  // carries how it stands in every environment.
  const [environmentPage, flags] = await Promise.all([
    api.environments.list(project.key),
    listProjectFlags(project.key),
  ]);

  const environments = environmentPage.data;
  const defaultEnvironment =
    environments.find(
      (environment) => environment.id === project.defaultEnvironmentId,
    ) ??
    environments.find((environment) => environment.isDefault) ??
    environments[0] ??
    null;

  return (
    <div className="mx-auto max-w-3xl">
      <ProjectFlagsCard
        projectKey={project.key}
        flags={flags}
        environmentKey={defaultEnvironment?.key ?? null}
        environmentName={defaultEnvironment?.name ?? null}
      />
    </div>
  );
}
