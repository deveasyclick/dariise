import { SettingsCard } from "@/components/app/settings-card";
import { Badge } from "@/components/ui/badge";
import type { ProfileRecord } from "@/lib/profile-data";

/**
 * Read-only facts about the account.
 *
 * The Role badge is the one thing here that is not editable from this screen:
 * roles are a workspace concern, and `Owner` is the fixture's own value.
 */
export function ProfileAccountCard({ profile }: { profile: ProfileRecord }) {
  const rows = [
    {
      label: "Role",
      value: (
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary text-[10px]"
        >
          {profile.role}
        </Badge>
      ),
    },
    { label: "Workspace", value: profile.workspaceName },
    { label: "Member since", value: profile.memberSinceLabel },
  ];

  return (
    <SettingsCard title="Account">
      <dl className="divide-y text-[12px]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
          >
            <dt className="text-muted-foreground shrink-0">{row.label}</dt>
            <dd className="min-w-0 truncate text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
    </SettingsCard>
  );
}
