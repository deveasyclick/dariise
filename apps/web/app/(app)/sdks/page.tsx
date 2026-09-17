import type { Metadata } from "next";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "cn";
import { environmentColorSwatch } from "@/components/app/environments/environment-colors";
import { SdkIntegration } from "@/components/app/sdks/sdk-integration";
import { PageHeader } from "@/components/app/page-header";
import { getEnvironments } from "@/lib/environment-data";

export const metadata: Metadata = {
  title: "SDKs & Integration",
  description:
    "Install a client SDK, then evaluate this project's flags with sub-10ms latency.",
};

// Endpoints and masked keys are resolved per environment, and nothing on this
// screen is time-relative — but the environment comes from the same fixtures the
// rest of the dashboard reads.
export const dynamic = "force-dynamic";

export default function SdksPage() {
  const environments = getEnvironments(new Date());
  const environment =
    environments.find((item) => item.isDefault) ?? environments[0];

  return (
    <>
      <PageHeader
        title="SDKs & Integration"
        description="Install a client SDK, then evaluate this project's flags with sub-10ms latency."
      >
        <span
          title="Switch environment — coming soon"
          className="bg-card inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px]"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              environmentColorSwatch[environment.color],
            )}
          />
          {environment.name}
          <ChevronDownIcon
            aria-hidden="true"
            className="text-muted-foreground size-3.5"
          />
        </span>
      </PageHeader>

      <SdkIntegration
        connection={{
          environmentName: environment.name,
          maskedKey: environment.maskedKey,
          endpoint: environment.baseUrl,
          streamEndpoint: environment.streamUrl,
        }}
      />
    </>
  );
}
