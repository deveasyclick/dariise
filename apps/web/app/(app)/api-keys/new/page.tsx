import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { CreateApiKeyForm } from "@/components/app/api-keys/create-api-key-form";
import { getEnvironmentOptions } from "@/lib/environment-data";

export const metadata: Metadata = {
  title: "Create API Key",
  description: "Generate a key for an SDK to authenticate with Dariise.",
};

export const dynamic = "force-dynamic";

export default function CreateApiKeyPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <Link
          href="/api-keys"
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-[12px] transition-colors"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-3.5" />
          API Keys
        </Link>

        <h1 className="text-xl font-semibold tracking-tight">Create API key</h1>
        <p className="text-muted-foreground mt-1 text-[13px]">
          Generate a key for an SDK to authenticate with Dariise.
        </p>
      </div>

      <CreateApiKeyForm environments={getEnvironmentOptions()} />
    </div>
  );
}
