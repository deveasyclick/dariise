import type { ReactNode } from "react";
import { SettingsCard } from "@/components/app/settings-card";
import { Badge } from "@/components/ui/badge";

function Unavailable({ reason }: { reason: string }) {
  return (
    <span className="text-muted-foreground" title={reason}>
      Not available
    </span>
  );
}

export function ProfileAccountCard({
  role,
  workspaceName,
}: {
  role: string | null;
  workspaceName: string | null;
}) {
  const rows: Array<{ label: string; value: ReactNode }> = [
    {
      label: "Role",
      value: role ? (
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary text-[10px]"
        >
          {role}
        </Badge>
      ) : (
        <Unavailable reason="The API did not report a workspace role." />
      ),
    },
    {
      label: "Workspace",
      value: workspaceName ?? (
        <Unavailable reason="The API did not report a workspace." />
      ),
    },
    {
      label: "Member since",
      value: (
        <Unavailable reason="The API does not expose an account creation date." />
      ),
    },
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
