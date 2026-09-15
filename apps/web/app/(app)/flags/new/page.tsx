import type { Metadata } from "next";
import { CreateFlagForm } from "@/components/app/flags/create-flag-form";
import { getDashboardData } from "@/lib/dashboard-data";

export const metadata: Metadata = {
  title: "Create Feature Flag",
  description: "Define a new flag, then configure targeting per environment.",
};

export const dynamic = "force-dynamic";

export default function CreateFlagPage() {
  const { flags } = getDashboardData(new Date());

  return (
    <div className="mx-auto max-w-5xl">
      <CreateFlagForm existingKeys={flags.map((flag) => flag.key)} />
    </div>
  );
}
