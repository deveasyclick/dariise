import type { Metadata } from "next";
import { CreateEnvironmentForm } from "@/components/app/environments/create-environment-form";
import {
  getCoverageFlags,
  getEnvironmentOptions,
} from "@/lib/environment-data";

export const metadata: Metadata = {
  title: "Create Environment",
  description: "Add an isolated environment for testing and staged rollouts.",
};

export const dynamic = "force-dynamic";

export default function CreateEnvironmentPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <CreateEnvironmentForm
        environments={getEnvironmentOptions()}
        coverageFlags={getCoverageFlags()}
      />
    </div>
  );
}
