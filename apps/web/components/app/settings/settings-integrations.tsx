import {
  ActivityIcon,
  InfoIcon,
  ListChecksIcon,
  MessageSquareIcon,
  Share2Icon,
  SirenIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { SettingsCard } from "@/components/app/settings-card";
import { GitHubIcon } from "@/components/auth/brand-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  IntegrationApp,
  IntegrationGlyph,
  IntegrationTone,
} from "@/lib/settings-data";

/**
 * The app directory.
 *
 * `lucide-react` ships no third-party logos, so GitHub reuses the inline mark the
 * auth screens already have and the rest are tinted generic glyphs. Connecting an
 * app is not implemented, so the affordance is disabled with a title while a
 * connected app shows its status instead.
 */

const glyphs: Record<IntegrationGlyph, LucideIcon | typeof GitHubIcon> = {
  slack: MessageSquareIcon,
  github: GitHubIcon,
  datadog: ActivityIcon,
  pagerduty: SirenIcon,
  jira: ListChecksIcon,
  segment: Share2Icon,
};

const toneClass: Record<IntegrationTone, string> = {
  primary: "bg-primary/10 text-primary",
  purple: "bg-purple-ink/10 text-purple-ink",
  green: "bg-ok-ink/10 text-ok-ink",
  info: "bg-info-ink/10 text-info-ink",
  slate: "bg-muted text-slate-ink",
};

export function SettingsIntegrations({ apps }: { apps: IntegrationApp[] }) {
  return (
    <div>
      <SettingsCard
        title="Connected apps"
        description="Connect Dariise to the tools your team already uses."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {apps.map((app) => {
            const Glyph = glyphs[app.glyph];

            return (
              <li
                key={app.key}
                className="bg-muted/50 flex items-center gap-3 rounded-lg p-3"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    toneClass[app.tone],
                  )}
                >
                  <Glyph className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium">{app.name}</p>
                  <p className="text-muted-foreground truncate text-[11px]">
                    {app.description}
                  </p>
                </div>

                {app.connected ? (
                  <Badge variant="ok" className="shrink-0 gap-1.5">
                    <span
                      aria-hidden="true"
                      className="bg-ok-ink size-1.5 rounded-full"
                    />
                    Connected
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="Connecting an app — coming soon"
                    className="shrink-0 text-[11px]"
                  >
                    Connect
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </SettingsCard>

      <div className="bg-muted mt-3 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2">
        <span className="bg-card text-info-ink flex size-6 shrink-0 items-center justify-center rounded-md border">
          <InfoIcon aria-hidden="true" className="size-3.5" />
        </span>
        <p className="text-muted-foreground text-[11px]">
          Looking for SDKs or webhooks? They live in the Developer section of the
          sidebar.
        </p>
        <span
          aria-disabled="true"
          title="SDKs and webhooks — coming soon"
          className="text-primary ml-auto text-[11px]"
        >
          Open SDKs &amp; Integration →
        </span>
      </div>
    </div>
  );
}
