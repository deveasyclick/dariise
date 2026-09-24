/**
 * Billing fixtures.
 *
 * The API exposes no billing endpoint — no plan, usage, payment-method or
 * invoice route — so this screen cannot be served from real responses yet. The
 * figures are the design's and stay here until a billing backend exists.
 *
 * Dates are derived from a caller-supplied `now` rather than frozen: the renewal
 * date is the first of next month and the invoices are the first of this month
 * and the two before it, so the screen stays plausible whenever it is opened
 * instead of drifting stale.
 *
 * The environment count is passed in by the caller, which reads it from the
 * API, so the allowance cannot disagree with the Environments screen. The
 * evaluation and user figures are design fixtures; the user figure is the same
 * one the Analytics screen reports.
 */

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
 * @param environmentCount - The workspace's real environment count, read from
 * the API by the caller.
 */
export function getBillingSummary(
  now: Date,
  environmentCount: number,
): BillingSummary {
  const evaluations = 48_200_000;
  const activeUsers = 128_940;
  const environments = environmentCount;

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
