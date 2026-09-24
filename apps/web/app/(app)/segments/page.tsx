import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SegmentList } from "@/components/app/segments/segment-list";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";
import { getScope } from "@/lib/scope";

export const metadata: Metadata = {
  title: "Segments",
  description:
    "Define reusable groups of users and reference them from any flag's targeting rules.",
};

export const dynamic = "force-dynamic";

export default async function SegmentsPage(props: PageProps<"/segments">) {
  const { project } = await getScope();
  if (!project) return null;

  const { q } = await props.searchParams;
  const search = typeof q === "string" ? q : undefined;
  const page = await api.segments.list(project.key, { search });

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

      <SegmentList
        segments={page.data}
        search={search ?? ""}
        nextCursor={page.nextCursor}
        now={new Date().toISOString()}
      />
    </>
  );
}
