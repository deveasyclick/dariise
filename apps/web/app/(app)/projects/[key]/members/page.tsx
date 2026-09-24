import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectMembersCard } from "@/components/app/projects/project-cards";
import * as api from "@/lib/api";
import { loadProject } from "../load-project";

export const metadata: Metadata = {
  title: "Members · Project",
  description: "Everyone with access to this project.",
};

export const dynamic = "force-dynamic";

export default async function ProjectMembersPage(
  props: PageProps<"/projects/[key]/members">,
) {
  const { key } = await props.params;
  const project = await loadProject(key);

  if (!project) notFound();

  const members = await api.members.list(project.key);

  return (
    <div className="mx-auto max-w-2xl">
      <ProjectMembersCard members={members} />
    </div>
  );
}
