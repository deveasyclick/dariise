import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SegmentDetailHeader } from "@/components/app/segments/segment-headers";
import { SegmentMembers } from "@/components/app/segments/segment-panels";
import { SegmentTabs } from "@/components/app/segments/segment-tabs";
import { getSegment } from "@/lib/segment-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/segments/[key]/members">,
): Promise<Metadata> {
  const { key } = await props.params;
  const segment = getSegment(key, new Date());

  return {
    title: segment ? `${segment.name} · Members` : "Segment not found",
    description: `Members of ${key}.`,
  };
}

export default async function SegmentMembersPage(
  props: PageProps<"/segments/[key]/members">,
) {
  const { key } = await props.params;
  const segment = getSegment(key, new Date());
  if (!segment) notFound();

  return (
    <>
      <SegmentDetailHeader
        segmentKey={segment.key}
        name={segment.name}
        description={segment.description}
      />
      <SegmentTabs segmentKey={segment.key} />
      <SegmentMembers segment={segment} />
    </>
  );
}
