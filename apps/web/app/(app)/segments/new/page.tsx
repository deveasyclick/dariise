import type { Metadata } from "next";
import { CreateSegmentForm } from "@/components/app/segments/create-segment-form";
import { getScope } from "@/lib/scope";

export const metadata: Metadata = {
  title: "Create segment",
  description: "Define a reusable group of users that flags can target.",
};

export const dynamic = "force-dynamic";

export default async function CreateSegmentPage() {
  const { project } = await getScope();
  if (!project) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <CreateSegmentForm projectKey={project.key} />
    </div>
  );
}
