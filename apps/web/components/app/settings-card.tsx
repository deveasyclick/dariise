import type { ReactNode } from "react";
import { cn } from "cn";

interface SettingsCardProps {
  title: string;
  /** One line under the title explaining what the card controls. */
  description?: string;
  /** Right-hand side of the title row, e.g. a status pill or a saved hint. */
  action?: ReactNode;
  /** Bottom row, separated by a rule — e.g. a save bar. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * The card the Settings screens and the Profile screen are built from.
 *
 * These cards carry their title and explanation inside the body, rather than in
 * the bordered header `SectionCard` uses, so the title/description/row rhythm is
 * defined once instead of on every screen.
 */
export function SettingsCard({
  title,
  description,
  action,
  footer,
  className,
  children,
}: SettingsCardProps) {
  return (
    <section className={cn("bg-card rounded-lg border p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-medium">{title}</h2>
          {description ? (
            <p className="text-muted-foreground mt-1 text-[11px]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-3">{children}</div>

      {footer ? <div className="mt-3 border-t pt-3">{footer}</div> : null}
    </section>
  );
}

/** The label and helper pair that opens a row in one of these cards. */
export function SettingsRowLabel({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] font-medium">{label}</p>
      <p className="text-muted-foreground mt-0.5 text-[11px]">{description}</p>
    </div>
  );
}
