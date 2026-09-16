import { ThemeChoice } from "@/components/app/theme-choice";
import {
  SettingsCard,
  SettingsRowLabel,
} from "@/components/app/settings-card";
import type { WorkspaceTheme } from "@/lib/settings-data";

/** Appearance — the workspace-wide default look. */
export function SettingsAppearance({ theme }: { theme: WorkspaceTheme }) {
  return (
    <SettingsCard
      title="Appearance"
      description="Set the default look for everyone in this workspace."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SettingsRowLabel
          label="Theme"
          description="Applies to all members by default."
        />
        <ThemeChoice theme={theme} />
      </div>
    </SettingsCard>
  );
}
