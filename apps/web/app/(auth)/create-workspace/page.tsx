import type { Metadata } from "next";
import { CreateWorkspaceForm } from "@/components/auth/create-workspace-form";
import { getDataRegions } from "@/lib/onboarding-data";

export const metadata: Metadata = {
  title: "Create workspace",
  description: "Create a workspace to hold your Dariise projects and flags.",
};

export default function CreateWorkspacePage() {
  return <CreateWorkspaceForm regions={getDataRegions()} />;
}
