import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "cn";
import { environmentColorSwatch } from "@/components/app/environments/environment-colors";
import { SdkIntegration } from "@/components/app/sdks/sdk-integration";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";
import { resolveEnvironmentColor } from "@/lib/environment-color";
import { getScope } from "@/lib/scope";

export const metadata: Metadata = {
  title: "SDKs & Integration",
  description:
    "Install a client SDK, then evaluate this project's flags with sub-10ms latency.",
};

export const dynamic = "force-dynamic";

export default async function SdksPage() {
  const { project, environment } = await getScope();

  if (!project) return null;

  if (!environment) {
    return (
      <>
        <PageHeader
          title="SDKs & Integration"
          description="Install a client SDK, then evaluate this project's flags with sub-10ms latency."
        />
        <div className="bg-card rounded-lg border p-6">
          <p className="text-[13px] font-medium">No environment yet</p>
          <p className="text-muted-foreground mt-1 text-[12px]">
            An SDK key is issued per environment, so this project needs one
            before it can be integrated.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/environments/new">Create environment</Link>
          </Button>
        </div>
      </>
    );
  }

  const { connection } = await api.environments.get(
    project.key,
    environment.key,
  );

  return (
    <>
      <PageHeader
        title="SDKs & Integration"
        description="Install a client SDK, then evaluate this project's flags with sub-10ms latency."
      >
        <span className="bg-card inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px]">
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              environmentColorSwatch[resolveEnvironmentColor(environment.color)],
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
          maskedKey: connection.maskedKey,
          endpoint: connection.evalUrl,
          streamEndpoint: connection.streamUrl,
        }}
      />
    </>
  );
}
