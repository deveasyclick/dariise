import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MAX_PAGE_SIZE } from "@dariise/contracts";
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

  const environmentPage = await api.environments.list(project.key);
  const flagPages = await Promise.all(
    environmentPage.data.map((environment) =>
      api.flags.list(project.key, {
        environmentKey: environment.key,
        limit: MAX_PAGE_SIZE,
      }),
    ),
  );

  const flags = flagPages.flatMap((page) => page.data);
  const truncated = flagPages.some((page) => page.nextCursor !== null);

  return (
    <div className="mx-auto max-w-3xl">
      <ProjectFlagsCard
        projectKey={project.key}
        flags={flags}
        truncated={truncated}
      />
    </div>
  );
}
