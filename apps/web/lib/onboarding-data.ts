/**
 * TEMPORARY ONBOARDING MOCK DATA — not connected to anything.
 *
 * `apps/api` does not exist yet, so the create-workspace step reads its data
 * regions from the fixtures below, in the same spirit as `settings-data.ts` and
 * `environment-data.ts`. Nothing here is fetched or persisted. When the API
 * lands, replace the getter with a call to `@/lib/api` and delete this module.
 */

export interface DataRegionOption {
  /** Identifier stored with the workspace, e.g. `us-east-1`. */
  value: string;
  /** What the select shows, e.g. `US East (N. Virginia)`. */
  label: string;
}

const dataRegions: DataRegionOption[] = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "eu-central-1", label: "EU (Frankfurt)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
];

/** The region a new workspace starts on, as shown in the design. */
export const defaultDataRegion = "us-east-1";

/** Regions a workspace's evaluation data can be stored and processed in. */
export function getDataRegions(): DataRegionOption[] {
  return dataRegions;
}
