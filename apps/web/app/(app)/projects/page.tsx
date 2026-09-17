import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import {
  ProjectGrid,
  ProjectsOverviewCard,
} from "@/components/app/projects/project-cards";
import { Button } from "@/components/ui/button";
import { getProjectRecords } from "@/lib/project-data";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Every project owns its own environments, feature flags, SDK keys, and audit trail.",
};

// "Last changed" is relative, so the screen is rendered per request and the
// whole page shares one `now`.
export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = getProjectRecords();
  const now = new Date();

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

      <ProjectGrid projects={projects} />

      <div className="mt-3">
        <ProjectsOverviewCard projects={projects} now={now} />
      </div>
    </>
  );
}
