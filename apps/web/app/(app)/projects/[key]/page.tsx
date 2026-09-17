import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArchiveProjectCard,
  DefaultEnvironmentCard,
  ProjectEnvironmentsCard,
  ProjectFlagsCard,
  ProjectSummaryCard,
} from "@/components/app/projects/project-cards";
import { getCurrentUser } from "@/lib/dashboard-data";
import { getProject } from "@/lib/project-data";

export async function generateMetadata(
  props: PageProps<"/projects/[key]">,
): Promise<Metadata> {
  const { key } = await props.params;
  const project = getProject(key);

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
  const project = getProject(key);

  if (!project) notFound();

  // One `now` is not needed here: nothing on this screen is time-relative.
  const owner = getCurrentUser();

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <ProjectEnvironmentsCard project={project} />
        <ProjectFlagsCard project={project} limit={4} />
      </div>

      <div className="space-y-3">
        <ProjectSummaryCard project={project} owner={owner} />
        <DefaultEnvironmentCard project={project} />
        <ArchiveProjectCard />
      </div>
    </div>
  );
}
