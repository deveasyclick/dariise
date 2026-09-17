import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectFlagsCard } from "@/components/app/projects/project-cards";
import { getProject } from "@/lib/project-data";

export const metadata: Metadata = {
  title: "Flags · Project",
  description: "Every flag in this project, with its environment and state.",
};

export default async function ProjectFlagsPage(
  props: PageProps<"/projects/[key]/flags">,
) {
  const { key } = await props.params;
  const project = getProject(key);

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <ProjectFlagsCard project={project} />
    </div>
  );
}
