import {
  ActivityIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  BracesIcon,
  GitBranchIcon,
  type LucideIcon,
} from "lucide-react";
import { SectionCard } from "@/components/app/page-header";

const resources: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Documentation", icon: BookOpenIcon },
  { label: "API reference", icon: BracesIcon },
  { label: "Node SDK on GitHub", icon: GitBranchIcon },
  { label: "Status page", icon: ActivityIcon },
];

/**
 * Links to the SDK docs and status pages.
 *
 * None of them exist yet, so each row is non-interactive with a title and an
 * announced "Coming soon" rather than an external link that goes nowhere —
 * the same treatment the sidebar gives unbuilt screens.
 */
export function SdkResourcesCard() {
  return (
    <SectionCard title="Resources">
      <ul className="space-y-2">
        {resources.map((resource) => {
          const Icon = resource.icon;

          return (
            <li key={resource.label}>
              <span
                aria-disabled="true"
                title={`${resource.label} — coming soon`}
                className="bg-muted/60 flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2"
              >
                <span className="bg-card flex size-6 shrink-0 items-center justify-center rounded-md">
                  <Icon
                    aria-hidden="true"
                    className="text-muted-foreground size-3.5"
                  />
                </span>
                <span className="text-[12px]">{resource.label}</span>
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="text-muted-foreground ml-auto size-3.5 shrink-0"
                />
                <span className="sr-only">Coming soon</span>
              </span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
