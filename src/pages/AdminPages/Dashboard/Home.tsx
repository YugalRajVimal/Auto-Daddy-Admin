import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import DashboardPanelCard from "../../../components/COMP";

interface AdminDashboardAPI {
  carOwnersCount: number;
  autoShopOwnersCount: number;
  jobCardsCount: number;
  dealsCount: number;
  servicesCount: number;
  subServicesCount: number;
}

type StatCard = {
  label: string;
  value: number | string;
  bg: string;
  text: string;
  labelColor: string;
};

type StatRow = {
  title: string;
  cards: StatCard[];
};

const API_URL = import.meta.env.VITE_API_URL;

function StatCardView({ card }: { card: StatCard }) {
  return (
    <DashboardPanelCard className="mb-3 min-w-[110px] flex-1">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded text-sm font-bold ${card.bg} ${card.text}`}
        >
          {card.value}
        </div>
        <span className={`font-serif text-xs font-bold leading-tight ${card.labelColor}`}>
          {card.label}
        </span>
      </div>
    </DashboardPanelCard>
  );
}

export default function AdminDashboardHome() {
  const [data, setData] = useState<AdminDashboardAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = (API_URL?.replace(/\/+$/, "") ?? "") + "/api/admin/dashboard";
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed");
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) setData(json.data);
        else throw new Error(json.message || "Invalid response");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const rows: StatRow[] = [
    {
      title: "Car Owners",
      cards: [
        { label: "Total", value: data?.carOwnersCount ?? "—", bg: "bg-ad-green-light", text: "text-ad-green-dark", labelColor: "text-ad-green-dark" },
        { label: "Active", value: data?.carOwnersCount ?? "—", bg: "bg-pink-100", text: "text-ad-pink-dark", labelColor: "text-ad-pink-dark" },
        { label: "Non-Active", value: 0, bg: "bg-ad-blue-light", text: "text-ad-blue-dark", labelColor: "text-ad-blue-dark" },
        { label: "Closed", value: 0, bg: "bg-gray-200", text: "text-black", labelColor: "text-black" },
      ],
    },
    {
      title: "Vendors",
      cards: [
        { label: "Car Shops", value: data?.autoShopOwnersCount ?? "—", bg: "bg-ad-green-light", text: "text-ad-green-dark", labelColor: "text-ad-green-dark" },
        { label: "Car Wash", value: 0, bg: "bg-pink-100", text: "text-ad-pink-dark", labelColor: "text-ad-pink-dark" },
        { label: "Tire Master", value: 0, bg: "bg-ad-blue-light", text: "text-ad-blue-dark", labelColor: "text-ad-blue-dark" },
        { label: "Tow Truck", value: 0, bg: "bg-gray-200", text: "text-black", labelColor: "text-black" },
      ],
    },
    {
      title: "Subscription",
      cards: [
        { label: "Received", value: data?.dealsCount ?? "—", bg: "bg-ad-green-light", text: "text-ad-green-dark", labelColor: "text-ad-green-dark" },
        { label: "Pending", value: 0, bg: "bg-pink-100", text: "text-ad-pink-dark", labelColor: "text-ad-pink-dark" },
        { label: "In Process", value: 0, bg: "bg-ad-blue-light", text: "text-ad-blue-dark", labelColor: "text-ad-blue-dark" },
        { label: "Un-Answered", value: 0, bg: "bg-gray-200", text: "text-black", labelColor: "text-black" },
      ],
    },
    {
      title: "Help",
      cards: [
        { label: "Resolved", value: data?.jobCardsCount ?? "—", bg: "bg-ad-green-light", text: "text-ad-green-dark", labelColor: "text-ad-green-dark" },
        { label: "Received", value: data?.servicesCount ?? "—", bg: "bg-pink-100", text: "text-ad-pink-dark", labelColor: "text-ad-pink-dark" },
        { label: "In Process", value: data?.subServicesCount ?? "—", bg: "bg-ad-blue-light", text: "text-ad-blue-dark", labelColor: "text-ad-blue-dark" },
        { label: "Un-Answered", value: 0, bg: "bg-gray-200", text: "text-black", labelColor: "text-black" },
      ],
    },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-ad-app-bg px-4 py-4 sm:px-6 md:px-8 md:py-5 lg:px-10">
      <PageMeta title="Dashboard | AutoDaddy Admin" description="Admin dashboard" />

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : error ? (
        <div className="rounded-[10px] border border-red-300 bg-red-100 p-4 text-red-700">{error}</div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <section key={row.title}>
              <h2 className="mb-2 font-serif text-base font-bold text-ad-green-dark">{row.title}</h2>
              <div className="flex flex-wrap gap-2 overflow-visible pb-2">
                {row.cards.map((card) => (
                  <StatCardView key={card.label} card={card} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
