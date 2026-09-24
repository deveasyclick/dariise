import { SettingsNav } from "@/components/app/settings/settings-nav";
import { settingsDescription } from "@/components/app/settings/settings-options";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-[13px]">
          {settingsDescription}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
