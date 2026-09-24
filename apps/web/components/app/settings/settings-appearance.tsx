import {
  SettingsCard,
  SettingsRowLabel,
} from "@/components/app/settings-card";

export function SettingsAppearance() {
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
        <span
          className="text-muted-foreground shrink-0 text-[11px]"
          title="The API does not expose a workspace-level theme."
        >
          Not available — the API does not expose a workspace theme.
        </span>
      </div>
    </SettingsCard>
  );
}
