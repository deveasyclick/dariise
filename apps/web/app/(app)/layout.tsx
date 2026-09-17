import { AppSidebar } from "@/components/app/app-sidebar";
import { Topbar } from "@/components/app/topbar";
import { getDashboardData } from "@/lib/dashboard-data";
import { getEnvironmentOptions } from "@/lib/environment-data";
import { getCurrentProject, getProjects } from "@/lib/project-data";

/**
 * Application shell for the signed-in screens: fixed sidebar, topbar, and a
 * scrolling content area. A route group, so it adds no URL segment.
 *
 * Rendered per request so dashboard figures and relative timestamps stay
 * current rather than being frozen into the build.
 */
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: LayoutProps<"/">) {
  const { currentUser } = getDashboardData(new Date());
  // The switchers are scoped to one project and one environment; the workspace
  // name is owned by the settings fixtures and shown there, not in the chrome.
  const project = getCurrentProject();
  const projects = getProjects();
  const environments = getEnvironmentOptions();

  return (
    <div className="flex h-svh overflow-hidden">
      <AppSidebar
        user={currentUser}
        project={project}
        projects={projects}
        environments={environments}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={currentUser} />
        <main className="bg-background flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
