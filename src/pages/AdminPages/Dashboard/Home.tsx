import { useEffect, useState } from "react";
import { adminNotify } from "../../../utils/adminNotify";
import PageMeta from "../../../components/common/PageMeta";

interface AdminDashboardAPI {
  carOwners: {
    total: number;
    active: number;
    nonActive: number;
    closed: number;
  };
  shops: {
    carShops: number;
    carWash: number;
    tireMaster: number;
    towTruck: number;
  };
  subscriptions: {
    received: number;
    pending: number;
    inProcess: number;
    unAnswered: number;
  };
  help: {
    resolved: number;
    received: number;
    inProcess: number;
    unAnswered: number;
  };
}

type StatTone = "green" | "purple" | "blue" | "grey";

type StatCard = {
  label: string;
  value: number | string;
  tone: StatTone;
};

// Solid value squares with a matching label colour, as in the revised admin mockups.
const TONE_STYLES: Record<StatTone, { square: string; label: string }> = {
  green: { square: "bg-[#008000] text-white", label: "text-[#008000]" },
  purple: { square: "bg-[#a5348f] text-white", label: "text-[#8f1f7f]" },
  blue: { square: "bg-[#0000ff] text-white", label: "text-[#0000ff]" },
  grey: { square: "bg-[#cfcfcf] text-black", label: "text-black" },
};

type StatRow = {
  title: string;
  cards: StatCard[];
};

const API_URL = import.meta.env.VITE_API_URL;

function StatCardView({ card }: { card: StatCard }) {
  const tone = TONE_STYLES[card.tone];
  return (
    <div className="flex min-w-0 items-center gap-4 border border-gray-200 bg-white p-2.5 shadow-[4px_4px_0_0_#d9d9d9]">
      <div
        className={`flex h-14 min-w-[4.25rem] flex-shrink-0 items-center justify-center px-2 text-lg font-bold sm:h-[3.5rem] sm:min-w-[5rem] ${tone.square}`}
      >
        {card.value}
      </div>
      <span
        className={`flex-1 self-end whitespace-nowrap pb-1 pl-2 text-left font-serif text-base font-bold leading-tight sm:text-lg ${tone.label}`}
      >
        {card.label}
      </span>
    </div>
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
      .catch((e) => {
        const msg = e.message;
        setError(msg);
        adminNotify.error(msg);
      })
      .finally(() => setLoading(false));
      console.log(data);
        }, []);

  const rows: StatRow[] = [
    {
      title: "Car Owners",
      cards: [
        { label: "Total", value: data?.carOwners?.total ?? "—", tone: "green" },
        { label: "Active", value: data?.carOwners?.active ?? "—", tone: "purple" },
        { label: "Non-Active", value: data?.carOwners?.nonActive ?? "—", tone: "blue" },
        { label: "Closed", value: data?.carOwners?.closed ?? "—", tone: "grey" },
      ],
    },
    {
      title: "Vendors",
      cards: [
        { label: "Repair Shops", value: data?.shops?.carShops ?? "—", tone: "green" },
        { label: "Car Wash", value: data?.shops?.carWash ?? "—", tone: "purple" },
        { label: "Tire Master", value: data?.shops?.tireMaster ?? "—", tone: "blue" },
        { label: "Tow Truck", value: data?.shops?.towTruck ?? "—", tone: "grey" },
      ],
    },
    {
      title: "Subscription",
      cards: [
        { label: "Received", value: data?.subscriptions?.received ?? "—", tone: "green" },
        { label: "Pending", value: data?.subscriptions?.pending ?? "—", tone: "purple" },
        { label: "In Process", value: data?.subscriptions?.inProcess ?? "—", tone: "blue" },
        { label: "Un-Answered", value: data?.subscriptions?.unAnswered ?? "—", tone: "grey" },
      ],
    },
    {
      title: "Help",
      cards: [
        { label: "Resolved", value: data?.help?.resolved ?? "—", tone: "green" },
        { label: "Received", value: data?.help?.received ?? "—", tone: "purple" },
        { label: "In Process", value: data?.help?.inProcess ?? "—", tone: "blue" },
        { label: "Un-Answered", value: data?.help?.unAnswered ?? "—", tone: "grey" },
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
        <div className="mx-auto max-w-[1180px] space-y-5 lg:pl-6">
          {rows.map((row) => (
            <section key={row.title}>
              <h2 className="mb-2 font-serif text-xl font-bold text-ad-green">{row.title}</h2>
              <div className="grid grid-cols-1 gap-x-7 gap-y-3 pl-2 pr-2 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,250px))]">
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
