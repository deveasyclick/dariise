import type { Metadata } from "next";
import { CreateProjectForm } from "@/components/app/projects/create-project-form";
import { CreateProjectHeader } from "@/components/app/projects/create-project-header";

export const metadata: Metadata = {
  title: "Create project",
  description:
    "Group environments, flags, and keys under a single project.",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <CreateProjectHeader />
      <CreateProjectForm />
    </div>
  );
}
