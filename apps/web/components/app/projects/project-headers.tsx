import Link from "next/link";
import { ChevronLeftIcon, PencilIcon } from "lucide-react";
import { cn } from "cn";
import { HealthBadge } from "@/components/app/health-badge";
import { environmentColorTone } from "@/components/app/environments/environment-colors";
import { projectGlyphs } from "@/components/app/projects/project-glyphs";
import { ProjectMenu } from "@/components/app/projects/project-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectRecord } from "@/lib/project-data";

/**
 * Identity strip shown above the tabs on every project screen.
 *
 * A Server Component: the only interactive piece is the actions menu, which is
 * imported as a Client Component.
 */
export function ProjectHeader({ project }: { project: ProjectRecord }) {
  const Glyph = projectGlyphs[project.glyph];
  const tone = environmentColorTone[project.color];

  return (
    <div className="bg-card mb-4 rounded-lg border p-4">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-[12px] transition-colors"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-3.5" />
        Back to projects
      </Link>

      <div className="flex flex-wrap items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            tone,
          )}
        >
          <Glyph aria-hidden="true" className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {project.name}
            </h1>
            {project.isDefault ? (
              <Badge
                variant="outline"
                className="text-[10px] tracking-wide uppercase"
              >
                Default
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-0.5 text-[12px]">
            {project.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <HealthBadge status={project.status} />

          <Button
            variant="outline"
            size="sm"
            disabled
            title="Edit project — coming soon"
            className="gap-1.5 text-[11px]"
          >
            <PencilIcon aria-hidden="true" className="size-3.5" />
            Edit project
          </Button>

          <ProjectMenu name={project.name} />
        </div>
      </div>
    </div>
  );
}
