import type { ReactNode } from "react";
import { cn } from "cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/** Standard page title block used by every dashboard screen. */
export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-1 text-[13px]">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Link style shared by the "View all" / "Details" actions on section cards. */
export const sectionActionClass =
  "text-primary text-[11px] font-medium hover:underline";

/** A bordered card with a title row, used for all Overview panels. */
export function SectionCard({
  title,
  action,
  className,
  bodyClassName,
  children,
}: SectionCardProps) {
  return (
    <section className={cn("bg-card rounded-lg border", className)}>
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="text-[13px] font-medium">{title}</h2>
        {action}
      </header>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
