/**
 * TEMPORARY BILLING MOCK DATA — not connected to anything.
 *
 * `apps/api` does not exist yet, so the Billing tab reads from the fixture
 * below, in the same spirit as the other `-data` modules. Nothing here is
 * fetched, charged or persisted. When the API lands, replace `getBillingSummary`
 * with a call to `@/lib/api` and delete this module.
 *
 * Dates are derived from a caller-supplied `now` rather than frozen: the renewal
 * date is the first of next month and the invoices are the first of this month
 * and the two before it, so the screen stays plausible whenever it is opened
 * instead of drifting stale.
 *
 * The environment count is read from `environment-data.ts` so the allowance
 * cannot disagree with the Environments screen. The evaluation and user figures
 * are design fixtures; the user figure is the same one the Analytics screen
 * reports.
 */

import { getEnvironmentOptions } from "@/lib/environment-data";
import {
  formatCompactNumber,
  formatDate,
  formatInteger,
} from "@/lib/format";

export interface BillingPlan {
  name: string;
  /** Billing interval, shown as a badge beside the plan name. */
  interval: string;
  /** What the workspace pays each month, in whole dollars. */
  pricePerMonth: number;
  /** e.g. `Renews Oct 1, 2026 · billed annually`. */
  renewsLabel: string;
  seats: { used: number; total: number };
}

export interface UsageMeter {
  id: "evaluations" | "users" | "environments";
  label: string;
  value: number;
  limit: number;
  /** Preformatted current value, e.g. `48.2M`. */
  display: string;
  /** Preformatted allowance, e.g. `100M`. */
  limitDisplay: string;
  tone: "primary" | "info" | "purple";
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  expiresLabel: string;
}

export interface Invoice {
  id: string;
  dateLabel: string;
  amountLabel: string;
  status: "Paid" | "Due";
}

export interface BillingSummary {
  plan: BillingPlan;
  usage: UsageMeter[];
  payment: PaymentMethod;
  invoices: Invoice[];
}

const planName = "Scale";
const pricePerMonth = 499;
const seatCount = { used: 24, total: 30 };

/** One invoice is issued per month, on the first. */
const invoiceMonths = 3;

/** Noon on the first of the month `monthsAgo` before `now`, in local time. */
function monthStart(now: Date, monthsAgo: number): Date {
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1, 12);
}

function dollars(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Build the billing payload.
 *
 * @param now - The moment the billing period is measured from. The page passes
 * a single value for the whole render so server and client agree.
 */
export function getBillingSummary(now: Date): BillingSummary {
  const evaluations = 48_200_000;
  const activeUsers = 128_940;
  const environments = getEnvironmentOptions().length;

  return {
    plan: {
      name: planName,
      interval: "Annual",
      pricePerMonth,
      renewsLabel: `Renews ${formatDate(monthStart(now, -1).toISOString())} · billed annually`,
      seats: seatCount,
    },
    usage: [
      {
        id: "evaluations",
        label: "Flag evaluations",
        value: evaluations,
        limit: 100_000_000,
        display: formatCompactNumber(evaluations),
        limitDisplay: formatCompactNumber(100_000_000),
        tone: "primary",
      },
      {
        id: "users",
        label: "Monthly active users",
        value: activeUsers,
        limit: 250_000,
        display: formatInteger(activeUsers),
        limitDisplay: formatInteger(250_000),
        tone: "info",
      },
      {
        id: "environments",
        label: "Environments",
        value: environments,
        limit: 10,
        display: formatInteger(environments),
        limitDisplay: formatInteger(10),
        tone: "purple",
      },
    ],
    payment: {
      brand: "Visa",
      last4: "4242",
      expiresLabel: "08 / 25",
    },
    invoices: Array.from({ length: invoiceMonths }, (_, index) => ({
      id: `inv_${index + 1}`,
      dateLabel: formatDate(monthStart(now, index).toISOString()),
      amountLabel: dollars(pricePerMonth),
      status: "Paid" as const,
    })),
  };
}
