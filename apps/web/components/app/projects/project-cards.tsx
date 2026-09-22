import Link from "next/link";
import {
  ArchiveIcon,
  ArrowRightIcon,
  ChartColumnIcon,
  FlagIcon,
  GlobeIcon,
  KeyRoundIcon,
  ServerIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import {
  environmentColorSwatch,
  environmentColorTone,
} from "@/components/app/environments/environment-colors";
import { CoverageStatePill } from "@/components/app/environments/coverage-pill";
import { sectionActionClass, SectionCard } from "@/components/app/page-header";
import { projectGlyphs } from "@/components/app/projects/project-glyphs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CurrentUser } from "@/lib/dashboard-data";
import type {
  ProjectEnvironment,
  ProjectFlag,
  ProjectMember,
  ProjectRecord,
} from "@/lib/project-data";
import {
  getProjectFlagCount,
  getProjectUpdatedLabel,
} from "@/lib/project-data";

function flagState(flag: ProjectFlag): {
  kind: "on" | "off" | "percentage";
  percentage?: number;
} {
  if (flag.rollout >= 100) return { kind: "on" };
  if (flag.rollout <= 0) return { kind: "off" };

  return { kind: "percentage", percentage: flag.rollout };
}

/** Tile tint for a flag row, following the state it renders. */
function flagTone(flag: ProjectFlag): string {
  if (flag.rollout >= 100) return "bg-ok-ink/10 text-ok-ink";
  if (flag.rollout <= 0) return "bg-muted text-muted-foreground";

  return "bg-primary-ink/10 text-primary-ink";
}

/** Environment pills, tinted with each environment's own colour. */
function EnvironmentPills({
  environments,
  limit,
}: {
  readonly environments: ProjectEnvironment[];
  /** Show this many, then a `+N` chip. Omit to show them all. */
  readonly limit?: number;
}) {
  const shown = limit ? environments.slice(0, limit) : environments;
  const hidden = environments.length - shown.length;

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {shown.map((environment) => (
        <span
          key={environment.key}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
            environmentColorTone[environment.color],
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              environmentColorSwatch[environment.color],
            )}
          />
          {environment.name}
        </span>
      ))}
      {hidden > 0 ? (
        <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium">
          +{hidden}
        </span>
      ) : null}
    </span>
  );
}

/** Count tile shown across the bottom of a project card. */
function ProjectStatTile({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className={cn("rounded-md px-2.5 py-1.5 text-center", tone)}>
      <p className="text-[14px] font-semibold">{value}</p>
      <p className="text-[10px] opacity-80">{label}</p>
    </div>
  );
}

/** One project as summarised on the Projects list. */
export function ProjectCard({ project }: { project: ProjectRecord }) {
  const Glyph = projectGlyphs[project.glyph];
  const tone = environmentColorTone[project.color];

  return (
    <article
      className={cn(
        "bg-card flex flex-col rounded-lg border p-4",
        project.isDefault && "border-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            tone,
          )}
        >
          <Glyph aria-hidden="true" className="size-4" />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-medium">
          {project.name}
        </h2>
        <Badge
          variant={project.isDefault ? "outline" : "ok"}
          className="gap-1.5 text-[10px]"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              project.isDefault ? "bg-primary" : "bg-ok-ink",
            )}
          />
          {project.isDefault ? "Default" : "Active"}
        </Badge>
      </div>

      <p className="text-muted-foreground mt-2 line-clamp-2 text-[11px] leading-5">
        {project.description}
      </p>

      <div className="mt-3">
        <EnvironmentPills environments={project.environments} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ProjectStatTile
          value={project.environments.length}
          label="envs"
          tone="bg-primary/10 text-primary"
        />
        <ProjectStatTile
          value={getProjectFlagCount(project)}
          label="flags"
          tone="bg-primary-ink/10 text-primary-ink"
        />
        <ProjectStatTile
          value={project.sdkKeys}
          label="keys"
          tone="bg-purple-ink/10 text-purple-ink"
        />
      </div>

      <Link
        href={`/projects/${project.key}`}
        className="text-muted-foreground hover:text-foreground mt-4 flex items-center justify-between gap-2 border-t pt-3 text-[12px] transition-colors"
      >
        Open project
        <ArrowRightIcon aria-hidden="true" className="size-3.5" />
      </Link>
    </article>
  );
}

/** The project cards, with the empty state the design does not cover. */
export function ProjectGrid({ projects }: { projects: ProjectRecord[] }) {
  if (projects.length === 0) {
    return (
      <section className="bg-card text-muted-foreground rounded-lg border border-dashed p-6 text-[13px]">
        No projects yet. Create one to give your flags and environments a home.
      </section>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.key} project={project} />
      ))}
    </div>
  );
}

/** Table header style used by every project table. */
const tableHeadClass =
  "text-muted-foreground h-8 text-[10px] font-medium tracking-[0.1em] uppercase";

/** Every project in one table: environments, flags, keys and last change. */
export function ProjectsOverviewCard({
  projects,
  now,
}: {
  projects: ProjectRecord[];
  /** The moment "last changed" is measured against; one per render. */
  now: Date;
}) {
  return (
    <SectionCard
      title="Projects overview"
      action={
        <span className="text-muted-foreground text-[11px]">
          Environments, flags and SDK keys per project
        </span>
      }
      bodyClassName="p-0"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn(tableHeadClass, "pl-4")}>
              Project
            </TableHead>
            <TableHead className={tableHeadClass}>Environments</TableHead>
            <TableHead className={tableHeadClass}>Flags</TableHead>
            <TableHead className={tableHeadClass}>SDK keys</TableHead>
            <TableHead className={tableHeadClass}>Last changed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const Glyph = projectGlyphs[project.glyph];

            return (
              <TableRow key={project.key}>
                <TableCell className="pl-4">
                  <span className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md",
                        environmentColorTone[project.color],
                      )}
                    >
                      <Glyph aria-hidden="true" className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <Link
                        href={`/projects/${project.key}`}
                        className="block truncate text-[12px] font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                      <span className="text-muted-foreground block truncate text-[11px]">
                        {project.key} ·{" "}
                        {project.isDefault
                          ? "Default project"
                          : `Owned by ${project.ownerTeam}`}
                      </span>
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <EnvironmentPills
                    environments={project.environments}
                    limit={2}
                  />
                </TableCell>
                <TableCell className="text-[12px]">
                  {getProjectFlagCount(project)}
                </TableCell>
                <TableCell className="text-[12px]">{project.sdkKeys}</TableCell>
                <TableCell className="text-muted-foreground text-[11px]">
                  {getProjectUpdatedLabel(project, now)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

/** Environments of one project, with their flag totals. */
export function ProjectEnvironmentsCard({
  project,
}: {
  project: ProjectRecord;
}) {
  return (
    <SectionCard
      title="Environments"
      action={
        <Link href="/environments/new" className={sectionActionClass}>
          New environment
        </Link>
      }
      bodyClassName="p-0"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn(tableHeadClass, "pl-4")}>
              Environment
            </TableHead>
            <TableHead className={tableHeadClass}>Key</TableHead>
            <TableHead className={tableHeadClass}>Flags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {project.environments.map((environment) => (
            <TableRow key={environment.key}>
              <TableCell className="pl-4 text-[12px] font-medium">
                <Link
                  href={`/environments/${environment.key}`}
                  className="hover:underline"
                >
                  {environment.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-[11px]">
                {environment.key}
              </TableCell>
              <TableCell className="text-[12px]">
                {environment.flagsOn}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

interface ProjectFlagsCardProps {
  project: ProjectRecord;
  /** Cap the list and add a "View all" link, as the design does on Overview. */
  limit?: number;
}

/** Flags this project owns, each with the environment and state it serves. */
export function ProjectFlagsCard({ project, limit }: ProjectFlagsCardProps) {
  const flags = limit ? project.flags.slice(0, limit) : project.flags;

  return (
    <SectionCard
      title="Flags in this project"
      action={
        limit ? (
          <Link
            href={`/projects/${project.key}/flags`}
            className={sectionActionClass}
          >
            View all
          </Link>
        ) : undefined
      }
    >
      {flags.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">
          No flags in this project yet.
        </p>
      ) : (
        <ul className="divide-y">
          {flags.map((flag) => {
            const environment = project.environments.find(
              (item) => item.key === flag.environmentKey,
            );

            return (
              <li
                key={`${flag.key}-${flag.environmentKey}`}
                className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md",
                    flagTone(flag),
                  )}
                >
                  <FlagIcon aria-hidden="true" className="size-3.5" />
                </span>
                <Link
                  href={`/flags/${flag.key}`}
                  className="min-w-0 flex-1 truncate font-mono text-[12px] hover:underline"
                >
                  {flag.key}
                </Link>
                <span className="bg-muted text-muted-foreground shrink-0 rounded-md px-1.5 py-0.5 text-[10px]">
                  {environment?.name ?? flag.environmentKey}
                </span>
                <CoverageStatePill state={flagState(flag)} label="long" />
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/** Counts and owner of one project. */
export function ProjectSummaryCard({
  project,
  owner,
}: {
  project: ProjectRecord;
  owner: CurrentUser;
}) {
  const tiles = [
    { label: "Environments", value: project.environments.length },
    { label: "Flags", value: getProjectFlagCount(project) },
    { label: "Segments", value: project.segments },
    { label: "SDK keys", value: project.sdkKeys },
  ];

  return (
    <SectionCard title="Project summary">
      <dl className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-muted rounded-lg px-3 py-2.5">
            <dt className="text-muted-foreground text-[10px]">{tile.label}</dt>
            <dd className="mt-1 text-[15px] font-semibold">{tile.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-muted-foreground text-[11px]">Owner</span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-medium">
            {owner.initials}
          </span>
          <span className="truncate text-[12px] font-medium">{owner.name}</span>
        </span>
      </div>
    </SectionCard>
  );
}

/** The environment flags resolve in, and the rest of the project's set. */
export function DefaultEnvironmentCard({
  project,
}: {
  project: ProjectRecord;
}) {
  const environments = [...project.environments].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault),
  );

  return (
    <SectionCard title="Default environment">
      <p className="text-muted-foreground text-[11px] leading-5">
        Flags resolve here unless an environment override is set.
      </p>

      <ul className="mt-3 space-y-3">
        {environments.map((environment: ProjectEnvironment) => (
          <li key={environment.key} className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full",
                environmentColorTone[environment.color],
              )}
            >
              <GlobeIcon aria-hidden="true" className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium">
                {environment.name}
              </span>
              <span className="text-muted-foreground block text-[11px]">
                {environment.flagsOn} flags on
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 text-[11px] font-medium",
                environment.isDefault ? "text-primary" : "text-ok-ink",
              )}
            >
              {environment.isDefault ? "Default" : "Healthy"}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/** Danger zone. The action is disabled until the API can archive projects. */
export function ArchiveProjectCard() {
  return (
    <section className="border-danger-ink/30 bg-danger-ink/5 rounded-lg border p-4">
      <h2 className="text-danger-ink text-[13px] font-medium">
        Archive project
      </h2>
      <p className="text-muted-foreground mt-1 text-[11px] leading-5">
        Archiving hides this project and its environments from the switcher.
        Data is retained for 30 days.
      </p>

      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Archive project — coming soon"
          className="border-danger-ink/40 text-danger-ink gap-1.5 text-[11px]"
        >
          <ArchiveIcon aria-hidden="true" className="size-3.5" />
          Archive project
        </Button>
      </div>
    </section>
  );
}

/** The project's team, owner first. */
export function ProjectMembersCard({ members }: { members: ProjectMember[] }) {
  return (
    <SectionCard
      title="Members"
      action={
        <span className="text-muted-foreground text-[11px]">
          {members.length} members
        </span>
      }
    >
      <ul className="divide-y">
        {members.map((member) => (
          <li
            key={member.email}
            className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium">
              {member.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium">
                {member.name}
              </span>
              <span className="text-muted-foreground block truncate text-[11px]">
                {member.email}
              </span>
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {member.role}
            </Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

const projectBenefits: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    title: "Environments",
    description: "Development, Staging and Production created for you.",
    icon: ServerIcon,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Feature flags",
    description: "Flag definitions and targeting shared across environments.",
    icon: FlagIcon,
    tone: "bg-purple-ink/10 text-purple-ink",
  },
  {
    title: "SDK keys",
    description: "Scoped keys per environment with instant rotation.",
    icon: KeyRoundIcon,
    tone: "bg-info-ink/10 text-info-ink",
  },
  {
    title: "Insights",
    description: "Evaluation volume, latency and error analytics.",
    icon: ChartColumnIcon,
    tone: "bg-primary-ink/10 text-primary-ink",
  },
];

/** Right rail of the create screen: what a new project comes with. */
export function ProjectWhatYouGetCard() {
  return (
    <SectionCard title="What you get">
      <ul className="space-y-3">
        {projectBenefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <li key={benefit.title} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md",
                  benefit.tone,
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[12px] font-medium">
                  {benefit.title}
                </span>
                <span className="text-muted-foreground block text-[11px] leading-5">
                  {benefit.description}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
