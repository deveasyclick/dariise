import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";

/**
 * The two note cards beside the create form.
 *
 * Both are static, so they stay Server Components; only the form and the list's
 * table need a client boundary.
 */

const bestPractices = [
  "Store keys in environment variables, never in source control.",
  "Use a separate key per service so you can revoke independently.",
  "Prefer read-only keys for clients that only evaluate flags.",
  "Set an expiration for keys used in short-lived jobs.",
] as const;

/** Reminder that the credential is not retrievable after it is issued. */
export function KeyShownOnceCard() {
  return (
    <section className="bg-info-ink/5 border-info-ink/20 rounded-lg border p-4">
      <div className="flex items-center gap-2.5">
        <span className="bg-info-ink/10 text-info-ink flex size-7 shrink-0 items-center justify-center rounded-lg">
          <TriangleAlertIcon aria-hidden="true" className="size-3.5" />
        </span>
        <h2 className="text-[13px] font-medium">Your key is shown once</h2>
      </div>
      <p className="text-muted-foreground mt-2 text-[12px] leading-5">
        Copy it somewhere safe. For security, it cannot be viewed again after you
        leave this page.
      </p>
    </section>
  );
}

/** The four rules the design lists next to the create form. */
export function SecurityBestPracticesCard() {
  return (
    <section className="bg-card rounded-lg border p-4">
      <h2 className="text-[13px] font-medium">Security best practices</h2>
      <ul className="mt-3 space-y-2.5">
        {bestPractices.map((practice) => (
          <li
            key={practice}
            className="text-muted-foreground flex items-start gap-2 text-[12px] leading-5"
          >
            <CircleCheckIcon
              aria-hidden="true"
              className="text-ok-ink mt-0.5 size-3.5 shrink-0"
            />
            {practice}
          </li>
        ))}
      </ul>
    </section>
  );
}
