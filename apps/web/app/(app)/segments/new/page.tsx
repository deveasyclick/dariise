import type { Metadata } from "next";
import { CreateSegmentForm } from "@/components/app/segments/create-segment-form";
import { getSegmentKeys } from "@/lib/segment-data";

export const metadata: Metadata = {
  title: "Create segment",
  description: "Define a reusable group of users that flags can target.",
};

export const dynamic = "force-dynamic";

export default function CreateSegmentPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <CreateSegmentForm existingKeys={getSegmentKeys()} />
    </div>
  );
}
