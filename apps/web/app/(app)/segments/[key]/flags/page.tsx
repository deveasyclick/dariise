import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SegmentDetailHeader } from "@/components/app/segments/segment-headers";
import { SegmentFlags } from "@/components/app/segments/segment-panels";
import { SegmentTabs } from "@/components/app/segments/segment-tabs";
import { getSegment } from "@/lib/segment-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/segments/[key]/flags">,
): Promise<Metadata> {
  const { key } = await props.params;
  const segment = getSegment(key, new Date());

  return {
    title: segment ? `${segment.name} · Flags` : "Segment not found",
    description: `Flags referencing ${key}.`,
  };
}

export default async function SegmentFlagsPage(
  props: PageProps<"/segments/[key]/flags">,
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
      <SegmentFlags segment={segment} />
    </>
  );
}
