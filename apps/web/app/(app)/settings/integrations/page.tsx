import type { Metadata } from "next";
import { SettingsIntegrations } from "@/components/app/settings/settings-integrations";
import {
  integrations,
  settingsDescription,
} from "@/components/app/settings/settings-options";

export const metadata: Metadata = {
  title: "Integrations",
  description: settingsDescription,
};

export const dynamic = "force-dynamic";

export default function SettingsIntegrationsPage() {
  return <SettingsIntegrations apps={integrations} />;
}
