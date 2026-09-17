import { notFound } from "next/navigation";
import { ProjectHeader } from "@/components/app/projects/project-headers";
import { ProjectTabs } from "@/components/app/projects/project-tabs";
import { getProject } from "@/lib/project-data";

/**
 * Shared shell for the project screens: one identity strip and the tab bar,
 * with each tab rendered as a real route underneath. A project key that does
 * not exist is a 404 rather than an empty page.
 */
export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/projects/[key]">) {
  const { key } = await params;
  const project = getProject(key);

  if (!project) notFound();

  return (
    <>
      <ProjectHeader project={project} />
      <ProjectTabs projectKey={project.key} />
      {children}
    </>
  );
}
