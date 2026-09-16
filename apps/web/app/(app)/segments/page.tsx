import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SegmentList } from "@/components/app/segments/segment-list";
import { Button } from "@/components/ui/button";
import { getSegmentSummaries } from "@/lib/segment-data";

export const metadata: Metadata = {
  title: "Segments",
  description:
    "Define reusable groups of users and reference them from any flag's targeting rules.",
};

export const dynamic = "force-dynamic";

export default function SegmentsPage() {
  const segments = getSegmentSummaries(new Date());

  return (
    <>
      <PageHeader
        title="Segments"
        description="Define reusable groups of users and reference them from any flag's targeting rules."
      >
        <Button asChild size="sm" className="gap-1.5 text-[11px]">
          <Link href="/segments/new">
            <PlusIcon aria-hidden="true" className="size-3.5" />
            Create segment
          </Link>
        </Button>
      </PageHeader>

      <SegmentList segments={segments} />
    </>
  );
}
