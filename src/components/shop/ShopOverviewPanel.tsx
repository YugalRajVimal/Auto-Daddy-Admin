import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useShopCustomers } from "../../hooks/useShopCustomers";
import { useShopJobCards } from "../../hooks/useShopJobCards";
import { isJobCardPaid, type JobCardListRow } from "../../lib/shopOwnerJobCards";
import type { MyCustomer } from "../../types/shopOwner";

type Period = "daily" | "week" | "month";

const PERIODS: { id: Period; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

/** A customer with no visit for this many days counts as "Quitted". */
const QUIT_AFTER_DAYS = 90;

type Stat = { label: string; value: number; display?: string; hint?: string; tone: string };
type Metric = { id: string; title: string; stats: Stat[] };

const TONES = {
  green: "from-[#b8f5b8] to-[#d6fcd6] text-[#0a6b0a]",
  blue: "from-[#7fd0f5] to-[#b3e3fa] text-[#0b4a6f]",
  pink: "from-[#f3a6cf] to-[#f8cbe2] text-[#8a1f5c]",
};

function periodStart(period: Period): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
  } else if (period === "month") {
    start.setDate(1);
  }
  return start;
}

function toTime(value?: string | null): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function toAmount(value: JobCardListRow["total"]): number {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function customerAddedTime(c: MyCustomer): number | null {
  return toTime(c.addedToShopAt ?? c.addedAt ?? c.linkedAt ?? c.createdAt);
}

const money = (n: number) =>
  `$ ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

function buildMetrics(customers: MyCustomer[], cards: JobCardListRow[], period: Period): Metric[] {
  const from = periodStart(period).getTime();
  const inPeriod = (t: number | null) => t != null && t >= from;
  const periodCards = cards.filter((card) => inPeriod(toTime(card.date)));

  const visitedNames = new Set(
    periodCards.map((card) => (card.phone || card.customerName || "").trim().toLowerCase()).filter(Boolean),
  );
  const quitBefore = Date.now() - QUIT_AFTER_DAYS * 86_400_000;
  const quitted = customers.filter((c) => {
    const last = toTime(c.recentJobCard?.date) ?? customerAddedTime(c);
    return last != null && last < quitBefore;
  }).length;

  const paidCards = periodCards.filter(isJobCardPaid);
  const billed = periodCards.reduce((sum, card) => sum + toAmount(card.total), 0);
  const collected = paidCards.reduce((sum, card) => sum + toAmount(card.total), 0);

  return [
    {
      id: "customers",
      title: "Customers",
      stats: [
        { label: "Total", value: customers.length, hint: "All customers in your list", tone: TONES.green },
        { label: "Visited", value: visitedNames.size, hint: "Customers with a job card in this period", tone: TONES.blue },
        { label: "Quitted", value: quitted, hint: `No visit in the last ${QUIT_AFTER_DAYS} days`, tone: TONES.pink },
      ],
    },
    {
      id: "job-cards",
      title: "Job Cards",
      stats: [
        { label: "Created", value: periodCards.length, tone: TONES.green },
        { label: "Paid", value: paidCards.length, tone: TONES.blue },
        { label: "Unpaid", value: periodCards.length - paidCards.length, tone: TONES.pink },
      ],
    },
    {
      id: "revenue",
      title: "Revenue",
      stats: [
        { label: "Billed", value: billed, display: money(billed), tone: TONES.green },
        { label: "Collected", value: collected, display: money(collected), tone: TONES.blue },
        { label: "Outstanding", value: billed - collected, display: money(billed - collected), tone: TONES.pink },
      ],
    },
  ];
}

/** Home → Overview: period tabs, metric carousel and proportional stat bars. */
export default function ShopOverviewPanel() {
  const [period, setPeriod] = useState<Period>("daily");
  const [metricIndex, setMetricIndex] = useState(0);
  const { customers, loading: customersLoading } = useShopCustomers();
  const { cards, loading: cardsLoading } = useShopJobCards();
  const loading = customersLoading || cardsLoading;

  const metrics = useMemo(() => buildMetrics(customers, cards, period), [customers, cards, period]);
  const metric = metrics[metricIndex];
  const max = Math.max(1, ...metric.stats.map((stat) => stat.value));

  const step = (delta: number) =>
    setMetricIndex((index) => (index + delta + metrics.length) % metrics.length);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-2">
      <div className="mx-auto flex rounded-xl bg-gray-100 p-1 shadow-inner" role="tablist" aria-label="Period">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={period === p.id}
            onClick={() => setPeriod(p.id)}
            className={`min-w-[7.5rem] rounded-lg px-5 py-2 text-base transition-all sm:min-w-[10rem] ${
              period === p.id
                ? "bg-white font-semibold text-ad-purple shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-gray-100 px-3 py-2.5">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous metric"
          className="flex size-9 items-center justify-center rounded-full text-[#0a8a0a] transition-colors hover:bg-white"
        >
          <FiChevronLeft className="size-6" strokeWidth={3} />
        </button>
        <div className="text-center">
          <p className="text-2xl font-medium text-gray-700">{metric.title}</p>
          <div className="mt-1 flex justify-center gap-1.5" aria-hidden>
            {metrics.map((m, i) => (
              <span
                key={m.id}
                className={`h-1.5 rounded-full transition-all ${i === metricIndex ? "w-5 bg-ad-purple" : "w-1.5 bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next metric"
          className="flex size-9 items-center justify-center rounded-full text-[#0a8a0a] transition-colors hover:bg-white"
        >
          <FiChevronRight className="size-6" strokeWidth={3} />
        </button>
      </div>

      <dl className="flex flex-col gap-6 px-2 sm:px-8">
        {metric.stats.map((stat) => (
          <div key={stat.label} className="grid items-center gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8">
            <dt className="text-2xl text-gray-700" title={stat.hint}>
              {stat.label}
            </dt>
            <dd className="h-14 rounded-lg bg-gray-50 ring-1 ring-gray-100">
              {loading ? (
                <div className="h-full w-full animate-pulse rounded-lg bg-gray-200" />
              ) : (
                <div
                  className={`flex h-full min-w-[4.5rem] items-center justify-end rounded-lg bg-gradient-to-r px-4 text-xl font-bold shadow-sm transition-[width] duration-500 ${stat.tone}`}
                  style={{ width: `${Math.max(12, (stat.value / max) * 100)}%` }}
                >
                  {stat.display ?? stat.value.toLocaleString()}
                </div>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
