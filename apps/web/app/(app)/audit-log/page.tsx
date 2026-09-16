import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";
import { AuditLogView } from "@/components/app/audit-log/audit-log-view";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getAuditLog } from "@/lib/audit-log-data";

export const metadata: Metadata = {
  title: "Audit Log",
  description:
    "A complete, immutable record of every flag, segment, and key change.",
};

export const dynamic = "force-dynamic";

export default function AuditLogPage() {
  // One `now` for the whole render, so every relative label agrees.
  const auditLog = getAuditLog(new Date());

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="A complete, immutable record of every flag, segment, and key change."
      >
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Export CSV — coming soon"
          className="gap-1.5 text-[11px]"
        >
          <DownloadIcon aria-hidden="true" className="size-3.5" />
          Export CSV
        </Button>
      </PageHeader>

      <AuditLogView {...auditLog} />
    </>
  );
}
