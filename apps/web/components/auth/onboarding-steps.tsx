import { Fragment } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "cn";

const steps = [
  { key: "account", label: "Account" },
  { key: "workspace", label: "Workspace" },
  { key: "project", label: "Project" },
] as const;

export type OnboardingStep = (typeof steps)[number]["key"];

export function OnboardingSteps({ current }: { current: OnboardingStep }) {
  const currentIndex = steps.findIndex((step) => step.key === current);

  return (
    <ol aria-label="Onboarding progress" className="flex items-center gap-2.5">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;

        return (
          <Fragment key={step.key}>
            {index > 0 ? (
              <li
                aria-hidden="true"
                className="bg-border h-px min-w-4 flex-1"
              />
            ) : null}
            <li className="flex shrink-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-medium",
                  done && "bg-success text-success-foreground",
                  active && "bg-primary text-primary-foreground",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <CheckIcon className="size-3" /> : index + 1}
              </span>
              {done ? <span className="sr-only">Completed</span> : null}
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "text-[12px]",
                  active || done
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
