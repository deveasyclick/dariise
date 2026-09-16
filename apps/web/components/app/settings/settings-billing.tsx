import { CreditCardIcon, DownloadIcon } from "lucide-react";
import { cn } from "cn";
import { SettingsCard } from "@/components/app/settings-card";
import { ProgressBar } from "@/components/app/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BillingSummary, UsageMeter } from "@/lib/billing-data";

/**
 * Plan, usage and invoices.
 *
 * Read-only: every action here needs a payment provider, so the buttons are
 * disabled with a title. The figures come from `billing-data.ts`, which derives
 * the invoice and renewal dates from the current month.
 */

const barFill: Record<UsageMeter["tone"], string> = {
  primary: "bg-primary-ink",
  info: "bg-info-ink",
  purple: "bg-purple-ink",
};

function percentOf(value: number, limit: number): number {
  return limit > 0 ? (value / limit) * 100 : 0;
}

export function SettingsBilling({ summary }: { summary: BillingSummary }) {
  const { plan, usage, payment, invoices } = summary;
  const seatsUsed = `${plan.seats.used} of ${plan.seats.total} used`;

  return (
    <div className="space-y-3">
      <SettingsCard title="Current plan">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold tracking-tight">
                {plan.name}
              </p>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary text-[10px]"
              >
                {plan.interval}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {plan.renewsLabel}
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              ${plan.pricePerMonth}
            </p>
            <p className="text-muted-foreground text-[11px]">/ month</p>
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Changing plan — coming soon"
              className="mt-2 text-[11px]"
            >
              Change plan
            </Button>
            <p className="text-muted-foreground mt-1.5 text-[10px]">
              {seatsUsed}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[12px] font-medium">Seats</p>
          <ProgressBar
            value={percentOf(plan.seats.used, plan.seats.total)}
            label={`${plan.seats.used} of ${plan.seats.total} seats used`}
            className="mt-1.5"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Usage this month"
        description="Counters reset on the first of each month."
      >
        <ul className="grid gap-2 sm:grid-cols-3">
          {usage.map((meter) => (
            <li key={meter.id} className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-[10px]">{meter.label}</p>
              <p className="mt-1 text-[15px] font-semibold tracking-tight tabular-nums">
                {meter.display}
                <span className="text-muted-foreground ml-1 text-[10px] font-normal">
                  / {meter.limitDisplay}
                </span>
              </p>
              <ProgressBar
                value={percentOf(meter.value, meter.limit)}
                label={`${meter.label} against the plan allowance`}
                className={cn("mt-2", barFill[meter.tone])}
              />
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard title="Payment & invoices">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <CreditCardIcon aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium">
              {payment.brand} ending {payment.last4}
            </p>
            <p className="text-muted-foreground text-[11px]">
              Expires {payment.expiresLabel}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Updating a payment method — coming soon"
            className="shrink-0 text-[11px]"
          >
            Update
          </Button>
        </div>

        <ul className="mt-3 divide-y">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-[12px]">{invoice.dateLabel}</span>
              <Badge variant="ok" className="gap-1.5">
                <span
                  aria-hidden="true"
                  className="bg-ok-ink size-1.5 rounded-full"
                />
                {invoice.status}
              </Badge>
              <span className="ml-auto text-[12px] tabular-nums">
                {invoice.amountLabel}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                disabled
                title="Downloading an invoice — coming soon"
                aria-label={`Download invoice for ${invoice.dateLabel}`}
              >
                <DownloadIcon aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </SettingsCard>
    </div>
  );
}
