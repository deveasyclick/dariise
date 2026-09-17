import type { ReactNode } from "react";
import { cn } from "cn";

interface AuthCardProps {
  title: string;
  description?: ReactNode;
  /** Rendered above the card, e.g. a "Back to sign in" link. */
  backLink?: ReactNode;
  /** Rendered at the top of the card, e.g. the onboarding step path. */
  steps?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * The white form card shared by the authentication screens. Presentation only
 * — all state lives in the individual form components.
 */
export function AuthCard({
  title,
  description,
  backLink,
  steps,
  className,
  children,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-sm">
      {backLink ? <div className="mb-6">{backLink}</div> : null}
      <div
        className={cn(
          "bg-card text-card-foreground rounded-xl border p-6 shadow-sm sm:p-8",
          className,
        )}
      >
        {steps ? <div className="mb-6">{steps}</div> : null}
        <header className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-muted-foreground text-sm leading-6">
              {description}
            </p>
          ) : null}
        </header>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
