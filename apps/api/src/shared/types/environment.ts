/**
 * The environment a request resolved to, as the modules that need one pass it
 * around. It carries only what a decision about writes needs: protected
 * environments stage changes for approval, archived ones accept none.
 */
export interface EnvironmentRef {
  id: string;
  key: string;
  name: string;
  isProtected: boolean;
  archivedAt: Date | null;
}
