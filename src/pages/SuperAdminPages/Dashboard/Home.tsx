import {
  FiUsers,
  FiCalendar,
  FiHeart,
  FiClock,
} from "react-icons/fi";
import { MdCurrencyRupee } from "react-icons/md";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Children"
          value="536"
          icon={<FiUsers />}
          bg="bg-blue-100"
          iconColor="text-blue-600"
        />

        <StatCard
          title="Total Sessions"
          value="5"
          icon={<FiCalendar />}
          bg="bg-purple-100"
          iconColor="text-purple-600"
        />

        <StatCard
          title="Active Therapists"
          value="1"
          icon={<FiHeart />}
          bg="bg-green-100"
          iconColor="text-green-600"
        />

        <StatCard
          title="Revenue (Unpaid)"
          value="₹700.00"
          icon={<MdCurrencyRupee />}
          bg="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white border rounded-xl p-6 min-h-[360px]">
          <div className="flex items-center gap-2 mb-2">
            <FiClock className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Activity Feed
            </h2>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Latest actions performed by users and system.
          </p>

          <div className="flex items-center justify-center h-56 text-gray-400">
            No recent activity logs.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reusable Components ---------------- */

function StatCard({
  title,
  value,
  icon,
  bg,
  iconColor,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>

      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}
      >
        <div className={`w-6 h-6 ${iconColor}`}>{icon}</div>
      </div>
    </div>
  );
}
