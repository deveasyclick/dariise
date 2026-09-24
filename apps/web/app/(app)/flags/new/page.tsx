import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreateFlagForm } from "@/components/app/flags/create-flag-form";
import { getScope } from "@/lib/scope";

export const metadata: Metadata = {
  title: "Create Feature Flag",
  description: "Define a new flag, then configure targeting per environment.",
};

export const dynamic = "force-dynamic";

export default async function CreateFlagPage() {
  const { project } = await getScope();

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <CreateFlagForm projectKey={project.key} />
    </div>
  );
}
