import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { cn } from "cn";

const steps = ["Project details", "Environments", "Invite team"] as const;

/**
 * Title block and step path of the create screen.
 *
 * The step path is a progress path rather than a wizard: every section of the
 * form is on one screen, and the path names the order the sections appear in.
 */
export function CreateProjectHeader() {
  return (
    <div className="mb-4">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-[12px] transition-colors"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-3.5" />
        Back to projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">
            Create project
          </h1>
          <p className="text-muted-foreground mt-1 text-[13px]">
            Group environments, flags, and keys under a single project.
          </p>
        </div>

        <ol className="flex shrink-0 items-center gap-3">
          {steps.map((step, index) => {
            const current = index === 0;

            return (
              <li key={step} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-4.5 items-center justify-center rounded-full text-[10px] font-medium",
                    current
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "text-[11px] font-medium",
                    current ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
