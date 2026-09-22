import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app/app-sidebar";
import { Topbar } from "@/components/app/topbar";
import { getDashboardData } from "@/lib/dashboard-data";
import { getEnvironmentOptions } from "@/lib/environment-data";
import { getCurrentProject, getProjects } from "@/lib/project-data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (!session.workspace) {
    redirect("/create-workspace");
  }

  if (!session.hasProject) {
    redirect("/create-project");
  }

  const { currentUser } = getDashboardData(new Date());

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
