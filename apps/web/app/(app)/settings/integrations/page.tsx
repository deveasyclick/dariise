import type { Metadata } from "next";
import { SettingsIntegrations } from "@/components/app/settings/settings-integrations";
import { getIntegrations, settingsDescription } from "@/lib/settings-data";

export const metadata: Metadata = {
  title: "Integrations",
  description: settingsDescription,
};

export const dynamic = "force-dynamic";

export default function SettingsIntegrationsPage() {
  return <SettingsIntegrations apps={getIntegrations()} />;
}
