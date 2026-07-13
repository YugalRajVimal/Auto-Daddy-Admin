import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import {
  FiArrowUpRight,
  FiBriefcase,
  FiClipboard,
  FiFileText,
  FiHeart,
  FiMapPin,
  FiPackage,
  FiTruck,
  FiUpload,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { putJson } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { useCarOwnerDashboard, useCarOwnerServiceSidebar } from "../../hooks/useOwnerPortal";
import { useCarOwnerAutoShops } from "../../hooks/useCarOwnerAutoShops";
import { useCarOwnerDeals } from "../../hooks/useCarOwnerDeals";
import { useCarOwnerDocuments } from "../../hooks/useCarOwnerDocuments";
import { useCarOwnerFavoriteShops } from "../../hooks/useCarOwnerFavoriteShops";
import { useCarOwnerInvoices } from "../../hooks/useCarOwnerInvoices";
import { useCarOwnerJobCards } from "../../hooks/useCarOwnerJobCards";
import { useCarOwnerOdometerReadings } from "../../hooks/useCarOwnerOdometerReadings";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import {
  formatOdometerStatus,
  mergeVehiclesWithOdometerReadings,
  odometerToNumber,
  remainingKmNumber,
} from "../../lib/carOwnerOdometer";
import type { OwnerShopType } from "../../lib/serviceCatalog";
import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { withDummyVehicles } from "../../lib/dummyOwnerHomeProfile";
import { Skeleton } from "../common/Skeleton";

const SHOP_TYPE_LABELS: Record<OwnerShopType, string> = {
  autoShop: "Auto shops",
  tyreShop: "Tire shops",
  carWash: "Car wash",
  towTruck: "Tow trucks",
};

type Accent = {
  tint: string;
  soft: string;
  text: string;
  ring: string;
  bar: string;
};

const ACCENTS: Accent[] = [
  { tint: "text-sky-700", soft: "bg-sky-50", text: "text-sky-800", ring: "hover:ring-sky-300", bar: "#0ea5e9" },
  { tint: "text-emerald-700", soft: "bg-emerald-50", text: "text-emerald-800", ring: "hover:ring-emerald-300", bar: "#10b981" },
  { tint: "text-amber-700", soft: "bg-amber-50", text: "text-amber-800", ring: "hover:ring-amber-300", bar: "#f59e0b" },
  { tint: "text-rose-700", soft: "bg-rose-50", text: "text-rose-800", ring: "hover:ring-rose-300", bar: "#f43f5e" },
  { tint: "text-indigo-700", soft: "bg-indigo-50", text: "text-indigo-800", ring: "hover:ring-indigo-300", bar: "#6366f1" },
  { tint: "text-teal-700", soft: "bg-teal-50", text: "text-teal-800", ring: "hover:ring-teal-300", bar: "#14b8a6" },
  { tint: "text-orange-700", soft: "bg-orange-50", text: "text-orange-800", ring: "hover:ring-orange-300", bar: "#f97316" },
  { tint: "text-cyan-700", soft: "bg-cyan-50", text: "text-cyan-800", ring: "hover:ring-cyan-300", bar: "#06b6d4" },
];

function StatCard({
  to,
  label,
  value,
  hint,
  icon,
  loading,
  accent,
  progress,
}: {
  to: string;
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  loading?: boolean;
  accent: Accent;
  progress?: number;
}) {
  const pct = progress == null ? null : Math.max(0, Math.min(100, progress));

  return (
    <Link
      to={to}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.1)] hover:ring-2 ${accent.ring}`}
    >
      <div className={`pointer-events-none absolute -right-6 -top-6 size-24 rounded-full ${accent.soft} opacity-80 transition group-hover:scale-110`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-14 rounded" />
          ) : (
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
          )}
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent.soft} ${accent.tint} transition group-hover:scale-105`}
        >
          {icon}
        </span>
      </div>
      {pct != null ? (
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: accent.bar }}
          />
        </div>
      ) : null}
      <div className="relative mt-3 flex items-center justify-between gap-2">
        {hint ? <p className="truncate text-xs text-slate-500">{hint}</p> : <span />}
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${accent.text} opacity-0 transition group-hover:opacity-100`}>
          Open <FiArrowUpRight size={12} />
        </span>
      </div>
    </Link>
  );
}

function OdometerQuickUpdate({
  vehicles,
  loading,
  onSaved,
}: {
  vehicles: CarOwnerVehicle[];
  loading: boolean;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [selectedId, setSelectedId] = useState<string>("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => vehicles.find((v) => v.id === (selectedId || vehicles[0]?.id)) ?? null,
    [selectedId, vehicles]
  );

  const current = selected?.odometerReading != null ? String(selected.odometerReading).trim() : "";
  const dueNum = odometerToNumber(selected?.dueOdometerReading);
  const currentNum = current ? Number(current) : null;
  const parsed = value.trim() ? Number(value.trim()) : null;
  const readingForRemaining = parsed != null && Number.isFinite(parsed) ? parsed : currentNum;
  const remaining = remainingKmNumber(dueNum, readingForRemaining);
  const progressPct =
    dueNum != null && dueNum > 0 && readingForRemaining != null
      ? Math.max(0, Math.min(100, Math.round((readingForRemaining / dueNum) * 100)))
      : 0;

  const displayValue = value || (selected ? current : "");

  const radialOptions: ApexOptions = {
    chart: { type: "radialBar", sparkline: { enabled: true } },
    colors: ["#0ea5e9"],
    plotOptions: {
      radialBar: {
        hollow: { size: "62%" },
        track: { background: "#e2e8f0" },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "18px",
            fontWeight: 700,
            color: "#0f172a",
            formatter: (val) => `${Math.round(val)}%`,
          },
        },
      },
    },
  };

  const handleVehicleChange = (id: string) => {
    setSelectedId(id);
    const v = vehicles.find((row) => row.id === id);
    setValue(v?.odometerReading != null ? String(v.odometerReading).trim() : "");
  };

  const handleSave = async () => {
    if (!token || !selected || parsed == null || !Number.isFinite(parsed) || parsed < 0) {
      toast.error("Enter a valid odometer reading.");
      return;
    }
    if (currentNum != null && parsed < currentNum) {
      toast.error("New reading should not be lower than the current value.");
      return;
    }
    setSaving(true);
    try {
      const res = await putJson<{ success?: boolean; message?: string }>(
        "/api/user/odometer",
        { vehicleId: selected.id, odometerReading: parsed },
        token
      );
      const message = typeof res.data?.message === "string" ? res.data.message.trim() : "";
      if (!res.ok || res.data?.success === false) {
        toast.error(message || "Could not update odometer.");
        return;
      }
      toast.success(message || "Odometer updated.");
      onSaved();
    } catch {
      toast.error("Network error while updating odometer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-sky-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Odometer</p>
          <h3 className="mt-0.5 text-base font-bold text-slate-900">Update reading</h3>
        </div>
        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800">
          {formatOdometerStatus(remaining)}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-9 w-full rounded" />
          <Skeleton className="mx-auto h-28 w-28 rounded-full" />
        </div>
      ) : vehicles.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          Add a vehicle first.{" "}
          <Link to="/owner/profile/vehicles" className="font-semibold text-sky-700 underline">
            My vehicles
          </Link>
        </p>
      ) : (
        <div className="mt-3 flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-[110px] shrink-0">
              <Chart options={radialOptions} series={[progressPct]} type="radialBar" height={110} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                Vehicle
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm"
                  value={selected?.id ?? ""}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                >
                  {vehicles.map((v, index) => {
                    const plate = v.licensePlateNo?.trim().toUpperCase();
                    const make = [v.make?.name, v.make?.model].filter(Boolean).join(" ");
                    return (
                      <option key={v.id} value={v.id}>
                        {plate || make || `Vehicle ${index + 1}`}
                      </option>
                    );
                  })}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <p className="font-semibold text-slate-500">Current</p>
                  <p className="font-bold tabular-nums text-slate-900">
                    {currentNum != null ? `${currentNum.toLocaleString()} km` : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <p className="font-semibold text-slate-500">Due</p>
                  <p className="font-bold tabular-nums text-slate-900">
                    {dueNum != null ? `${dueNum.toLocaleString()} km` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-2 text-sm"
              value={displayValue}
              onChange={(e) => setValue(e.target.value)}
              placeholder="New km reading"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="shrink-0 rounded-lg bg-sky-600 px-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {saving ? "…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerDashboardGrid() {
  const {
    thoughtOfTheDay,
    thoughtOfTheDayLiked,
    thoughtLikeBusy,
    toggleThoughtLike,
    nextService,
    loading: dashboardLoading,
    displayName,
  } = useCarOwnerDashboard();

  const { vehicles: apiVehicles, loading: vehiclesLoading, refresh: refreshVehicles } = useCarOwnerVehicles();
  const { readings, loading: readingsLoading, refresh: refreshReadings } = useCarOwnerOdometerReadings();
  const { invoiceRows, paidInvoices, unpaidInvoices, loading: invoicesLoading } = useCarOwnerInvoices();
  const { items: jobCards, loading: jobCardsLoading } = useCarOwnerJobCards();
  const { grouped, loading: dealsLoading } = useCarOwnerDeals();
  const { sections: docSections, loading: docsLoading } = useCarOwnerDocuments();
  const { favoriteIds, loading: favoritesLoading } = useCarOwnerFavoriteShops();
  const { shops, loading: shopsLoading } = useCarOwnerAutoShops({ serviceIds: [] });
  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();

  const vehicleSource = withDummyVehicles(apiVehicles);
  const vehicles = vehicleSource.vehicles;

  const vehiclesForOdo = useMemo(
    () => mergeVehiclesWithOdometerReadings(vehicles, readings),
    [vehicles, readings]
  );

  const documentsUploaded = useMemo(
    () =>
      docSections.reduce(
        (count, section) => count + section.fields.filter((f) => Boolean(f.uri)).length,
        0
      ),
    [docSections]
  );

  const docsExpected = Math.max(docSections.length * 4, 1);
  const docsProgress = Math.round((documentsUploaded / docsExpected) * 100);

  const shopTypeCounts = useMemo(() => {
    const counts: Partial<Record<OwnerShopType, number>> = {};
    for (const service of [...indoor, ...outdoor]) {
      const type = service.shopType;
      if (!type) continue;
      counts[type] = (counts[type] ?? 0) + 1;
    }
    return counts;
  }, [indoor, outdoor]);

  const shopTypeEntries = (Object.keys(SHOP_TYPE_LABELS) as OwnerShopType[]).map((key) => ({
    key,
    label: SHOP_TYPE_LABELS[key],
    count: shopTypeCounts[key] ?? 0,
  }));

  const activeDeals = grouped.all.length;
  const serviceDeals = grouped.Service.city.length + grouped.Service.others.length;
  const partsDeals = grouped.Parts.city.length + grouped.Parts.others.length;

  const thoughtTitle = thoughtOfTheDay.title?.trim() || "Thought of the day";
  const thoughtDescription =
    thoughtOfTheDay.description?.trim() &&
    thoughtOfTheDay.description.trim() !== "Start each day with a positive thought."
      ? thoughtOfTheDay.description.trim()
      : "A well-maintained car is a quiet promise — fuel for freedom, care for tomorrow.";

  const invoiceDonutOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: ["Paid", "Unpaid"],
    colors: ["#10b981", "#f59e0b"],
    legend: { position: "bottom", fontSize: "12px" },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Invoices",
              fontSize: "12px",
              color: "#64748b",
              formatter: () => String(invoiceRows.length),
            },
          },
        },
      },
    },
  };

  const dealsBarOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#6366f1", "#f43f5e"],
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: "45%", distributed: true },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: ["Service", "Parts"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#64748b", fontSize: "12px" } },
    },
    yaxis: {
      labels: { style: { colors: "#94a3b8", fontSize: "11px" } },
    },
    grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
  };

  const shopTypesBarOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#0ea5e9", "#14b8a6", "#f59e0b", "#8b5cf6"],
    plotOptions: {
      bar: { horizontal: true, borderRadius: 5, barHeight: "55%", distributed: true },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: shopTypeEntries.map((e) => e.label),
      labels: { style: { colors: "#64748b", fontSize: "11px" } },
    },
    yaxis: {
      labels: { style: { colors: "#475569", fontSize: "12px" } },
    },
    grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
  };

  const overviewSparkOptions: ApexOptions = {
    chart: { type: "area", sparkline: { enabled: true } },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: ["#10b981"],
    tooltip: { enabled: false },
  };

  const overviewSeries = [
    {
      name: "Activity",
      data: [
        vehicles.length,
        shops.length,
        invoiceRows.length,
        activeDeals,
        jobCards.length,
        documentsUploaded,
        favoriteIds.size,
        indoor.length + outdoor.length,
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-500">
              Welcome back{displayName ? `, ${displayName}` : ""}
            </p>
            {vehicleSource.usingDummy ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-100">
                Demo garage
              </span>
            ) : null}
          </div>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Garage overview
          </h2>
        </div>
        <div className="hidden w-40 sm:block">
          <Chart options={overviewSparkOptions} series={overviewSeries} type="area" height={48} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          to="/owner/profile/vehicles"
          label="Vehicles"
          value={vehiclesLoading ? "—" : vehicles.length}
          hint="In your garage"
          icon={<FiTruck size={18} />}
          loading={vehiclesLoading}
          accent={ACCENTS[0]}
          progress={vehicles.length > 0 ? 100 : 8}
        />
        <StatCard
          to="/owner/auto-shops"
          label="Shops nearby"
          value={shopsLoading ? "—" : shops.length}
          hint={`${favoriteIds.size} favorite${favoriteIds.size === 1 ? "" : "s"}`}
          icon={<FiMapPin size={18} />}
          loading={shopsLoading || favoritesLoading}
          accent={ACCENTS[1]}
          progress={shops.length ? Math.min(100, shops.length * 12) : 8}
        />
        <StatCard
          to="/owner/expenses/invoices"
          label="Invoices"
          value={invoicesLoading ? "—" : invoiceRows.length}
          hint={`${paidInvoices.length} paid · ${unpaidInvoices.length} unpaid`}
          icon={<FiFileText size={18} />}
          loading={invoicesLoading}
          accent={ACCENTS[2]}
          progress={
            invoiceRows.length
              ? Math.round((paidInvoices.length / Math.max(invoiceRows.length, 1)) * 100)
              : 8
          }
        />
        <StatCard
          to="/owner/deals/spare-parts"
          label="Deals"
          value={dealsLoading ? "—" : activeDeals}
          hint="Spare parts & service offers"
          icon={<FiPackage size={18} />}
          loading={dealsLoading}
          accent={ACCENTS[3]}
          progress={activeDeals ? Math.min(100, activeDeals * 8) : 8}
        />
        <StatCard
          to="/owner/expenses/job-cards"
          label="Job cards"
          value={jobCardsLoading ? "—" : jobCards.length}
          hint="Service history & approvals"
          icon={<FiClipboard size={18} />}
          loading={jobCardsLoading}
          accent={ACCENTS[4]}
          progress={jobCards.length ? Math.min(100, jobCards.length * 20) : 8}
        />
        <StatCard
          to="/owner/documents"
          label="Documents"
          value={docsLoading ? "—" : documentsUploaded}
          hint="Uploaded across vehicles"
          icon={<FiUpload size={18} />}
          loading={docsLoading}
          accent={ACCENTS[5]}
          progress={docsProgress || 8}
        />
        <StatCard
          to="/owner/auto-shops"
          label="Favorites"
          value={favoritesLoading ? "—" : favoriteIds.size}
          hint="Saved auto shops"
          icon={<FiHeart size={18} />}
          loading={favoritesLoading}
          accent={ACCENTS[6]}
          progress={favoriteIds.size ? Math.min(100, favoriteIds.size * 25) : 8}
        />
        <StatCard
          to="/owner/auto-shops"
          label="Services"
          value={servicesLoading ? "—" : indoor.length + outdoor.length}
          hint={`${indoor.length} indoor · ${outdoor.length} outdoor`}
          icon={<FiBriefcase size={18} />}
          loading={servicesLoading}
          accent={ACCENTS[7]}
          progress={
            indoor.length + outdoor.length
              ? Math.min(100, (indoor.length + outdoor.length) * 20)
              : 8
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-emerald-100">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Invoice mix
          </p>
          <h3 className="mt-0.5 text-base font-bold text-slate-900">Paid vs unpaid</h3>
          {invoicesLoading ? (
            <Skeleton className="mx-auto mt-4 h-40 w-40 rounded-full" />
          ) : (
            <div className="mt-1">
              <Chart
                options={invoiceDonutOptions}
                series={[paidInvoices.length, unpaidInvoices.length]}
                type="donut"
                height={220}
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-indigo-100">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Deals</p>
          <h3 className="mt-0.5 text-base font-bold text-slate-900">Service vs parts</h3>
          {dealsLoading ? (
            <Skeleton className="mt-4 h-40 w-full rounded-xl" />
          ) : (
            <div className="mt-2">
              <Chart
                options={dealsBarOptions}
                series={[{ name: "Deals", data: [serviceDeals, partsDeals] }]}
                type="bar"
                height={210}
              />
            </div>
          )}
        </div>

        <OdometerQuickUpdate
          vehicles={vehiclesForOdo}
          loading={vehiclesLoading || readingsLoading}
          onSaved={() => {
            void refreshVehicles();
            void refreshReadings();
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-sky-100 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Shop types
              </p>
              <h3 className="mt-0.5 text-base font-bold text-slate-900">Nearby service mix</h3>
            </div>
            <Link
              to="/owner/auto-shops"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
            >
              Browse <FiArrowUpRight size={12} />
            </Link>
          </div>
          {servicesLoading ? (
            <Skeleton className="mt-4 h-44 w-full rounded-xl" />
          ) : shopTypeEntries.every((e) => e.count === 0) ? (
            <p className="mt-4 text-sm text-slate-600">Shop categories will appear once services load.</p>
          ) : (
            <div className="mt-2">
              <Chart
                options={shopTypesBarOptions}
                series={[{ name: "Count", data: shopTypeEntries.map((e) => e.count) }]}
                type="bar"
                height={220}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-white/80 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-amber-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700/80">
                  Thought of the day
                </p>
                <h3 className="mt-1 text-sm font-bold text-slate-900">{thoughtTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => void toggleThoughtLike()}
                disabled={thoughtLikeBusy || dashboardLoading}
                aria-pressed={thoughtOfTheDayLiked}
                className={`rounded-full p-2 transition ${
                  thoughtOfTheDayLiked
                    ? "bg-rose-100 text-rose-600"
                    : "bg-white/80 text-slate-400 hover:text-rose-500"
                }`}
              >
                <FiHeart size={16} className={thoughtOfTheDayLiked ? "fill-current" : undefined} />
              </button>
            </div>
            {dashboardLoading ? (
              <Skeleton className="mt-3 h-16 w-full rounded" />
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {thoughtDescription || "No thought available right now."}
              </p>
            )}
          </div>

          <div className="flex-1 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-orange-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Next service
            </p>
            {dashboardLoading ? (
              <Skeleton className="mt-3 h-20 w-full rounded" />
            ) : nextService ? (
              <div className="mt-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {[
                    nextService.vehicle?.year,
                    nextService.vehicle?.make?.name,
                    nextService.vehicle?.make?.model,
                  ]
                    .filter(Boolean)
                    .join(" ") ||
                    nextService.vehicle?.licensePlateNo ||
                    "Vehicle"}
                </h3>
                <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-900">
                  Due at{" "}
                  {nextService.dueOdometerReading != null
                    ? `${Number(nextService.dueOdometerReading).toLocaleString()} km`
                    : "—"}
                </p>
                <Link
                  to="/owner/expenses/job-cards"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:underline"
                >
                  View job cards <FiArrowUpRight size={12} />
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No upcoming service due right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
