import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import {
  ProjectGrid,
  ProjectsOverviewCard,
  type ProjectCardData,
} from "@/components/app/projects/project-cards";
import { cappedCount } from "@/components/app/environments/capped-count";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every project owns its own environments, feature flags, SDK keys, and audit trail.",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await api.projects.list();

  // "Last changed" is relative, so the whole page shares one `now`.
  const now = new Date();

  const rows: ProjectCardData[] = await Promise.all(
    projects.map(async (project) => {
      const [environments, flags, apiKeys] = await Promise.all([
        api.environments.list(project.key),
        api.flags.list(project.key, { limit: 100 }),
        api.apiKeys.list(project.key),
      ]);

      return {
        project,
        environments: environments.data,
        flagCount: cappedCount(flags),
        apiKeyCount: cappedCount(apiKeys),
      };
    }),
  );

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every project owns its own environments, feature flags, SDK keys, and audit trail."
      >
        <Button asChild size="sm">
          <Link href="/projects/new">
            <PlusIcon aria-hidden="true" />
            New Project
          </Link>
        </Button>
      </PageHeader>

      <ProjectGrid projects={rows} />

      <div className="mt-3">
        <ProjectsOverviewCard projects={rows} now={now} />
      </div>
    </>
  );
}
