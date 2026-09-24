import type { Metadata } from "next";
import { CreateEnvironmentForm } from "@/components/app/environments/create-environment-form";
import * as api from "@/lib/api";
import { getScope } from "@/lib/scope";

export const metadata: Metadata = {
  title: "Create Environment",
  description: "Add an isolated environment for testing and staged rollouts.",
};

export const dynamic = "force-dynamic";

export default async function CreateEnvironmentPage() {
  const { project } = await getScope();

  if (!project) return null;

  const [environmentPage, coveragePage] = await Promise.all([
    api.environments.list(project.key),
    api.environments.coverage(project.key),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <CreateEnvironmentForm
        projectKey={project.key}
        environments={environmentPage.data}
        coverageFlags={coveragePage.data}
      />
    </div>
  );
}
