import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectMembersCard } from "@/components/app/projects/project-cards";
import { getProject, getProjectMembers } from "@/lib/project-data";

export const metadata: Metadata = {
  title: "Members · Project",
  description: "Everyone with access to this project.",
};

export default async function ProjectMembersPage(
  props: PageProps<"/projects/[key]/members">,
) {
  const { key } = await props.params;
  const project = getProject(key);

  if (!project) notFound();

  const members = getProjectMembers();

  return (
    <div className="mx-auto max-w-2xl">
      <ProjectMembersCard members={members} />
    </div>
  );
}
