import { AppSidebar } from "@/components/app/app-sidebar";
import { Topbar } from "@/components/app/topbar";
import { getDashboardData } from "@/lib/dashboard-data";
import { getWorkspaceProfile } from "@/lib/settings-data";

/**
 * Application shell for the signed-in screens: fixed sidebar, topbar, and a
 * scrolling content area. A route group, so it adds no URL segment.
 *
 * Rendered per request so dashboard figures and relative timestamps stay
 * current rather than being frozen into the build.
 */
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: LayoutProps<"/">) {
  const { currentUser, environmentLabel } = getDashboardData(new Date());
  // The workspace name is owned by the settings fixtures, so the chip in the
  // chrome and the General tab cannot disagree about what this workspace is.
  const workspaceName = getWorkspaceProfile().name;

  return (
    <div className="flex h-svh overflow-hidden">
      <AppSidebar
        user={currentUser}
        workspaceName={workspaceName}
        environmentLabel={environmentLabel}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={currentUser}
          workspaceName={workspaceName}
          environmentLabel={environmentLabel}
        />
        <main className="bg-background flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
