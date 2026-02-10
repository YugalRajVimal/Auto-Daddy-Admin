import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiUser,
} from "react-icons/fi";

// Dashboard data types
type UpcomingSessionDetail = {
  date: string;
  slotTime: string;
  patientName: string;
  patientId: string;
  therapyTypeName: string;
  appointmentId: string;
};

type DashboardData = {
  totalAppointments: number;
  totalSessions: number;
  upcomingSessions: number;
  checkedInSessions: number;
  totalEarnings: number;
  upcomingSessionDetails: UpcomingSessionDetail[];
};

export default function TherapistDashboardHome() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalAppointments: 0,
    totalSessions: 0,
    upcomingSessions: 0,
    checkedInSessions: 0,
    totalEarnings: 0,
    upcomingSessionDetails: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("therapist-token");
        const apiUrl = import.meta.env.VITE_API_URL || "";

        const response = await fetch(`${apiUrl}/api/therapist/dashboard`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const resp = await response.json();
        // Accepts { success: true, data: {...} }
        const data = resp?.data || {};

        setDashboardData({
          totalAppointments: data.totalAppointments || 0,
          totalSessions: data.totalSessions || 0,
          upcomingSessions: data.upcomingSessions || 0,
          checkedInSessions: data.checkedInSessions || 0,
          totalEarnings: data.totalEarnings || 0,
          upcomingSessionDetails: Array.isArray(data.upcomingSessionDetails)
            ? data.upcomingSessionDetails
            : [],
        });
      } catch (err) {
        setDashboardData({
          totalAppointments: 0,
          totalSessions: 0,
          upcomingSessions: 0,
          checkedInSessions: 0,
          totalEarnings: 0,
          upcomingSessionDetails: [],
        });
      }
    };

    fetchDashboardData();
  }, []);

  // Today's date as YYYY-MM-DD
  const todayDateStr = (() => {
    const today = new Date();
    // ISO string is YYYY-MM-DDTHH:mm:ss.sssZ
    return today.toISOString().split("T")[0];
  })();

  // Pretty today date string
  const todayPretty = (() => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  })();

  const todaysSessions = dashboardData.upcomingSessionDetails.filter(
    (s) => s.date === todayDateStr
  );

  return (
    <>
      <PageMeta title="Auto Daddy" description="Therapist Dashboard" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Dashboard Overview
            </h1>
            <p className="text-sm text-gray-500">
              Welcome back, Therapist User
            </p>
          </div>

          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            ● Status: Active
          </span>
        </div>

        {/* Stats Section */}
        {/* Top Stats Row: Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Total Appointments */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-500 to-primary-600 text-white shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Total Appointments</p>
                <h2 className="text-4xl font-bold mt-2">
                  {dashboardData.totalAppointments}
                </h2>
                <span className="inline-block mt-2 px-3 py-1 text-xs bg-white/20 rounded-full">
                  Unique Appointments
                </span>
              </div>
              <FiUser className="text-3xl opacity-90" />
            </div>
          </div>
          {/* Total Sessions */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-400 text-white shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Total Sessions</p>
                <h2 className="text-4xl font-bold mt-2">
                  {dashboardData.totalSessions}
                </h2>
                <span className="inline-block mt-2 px-3 py-1 text-xs bg-white/20 rounded-full">
                  Lifetime Total
                </span>
              </div>
              <FiCalendar className="text-3xl opacity-90" />
            </div>
          </div>
        </div>
        {/* Bottom Stats Row: Next three cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Upcoming Sessions */}
          <div className="p-6 rounded-xl border-2 border-orange-400 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Upcoming Sessions</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">
                  {dashboardData.upcomingSessions}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                  Scheduled for future
                </p>
              </div>
              <FiClock className="text-3xl text-orange-500" />
            </div>
          </div>
          {/* Checked In Sessions */}
          <div className="p-6 rounded-xl border-2 border-green-400 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Checked-In Sessions</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">
                  {dashboardData.checkedInSessions}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                  Marked as attended
                </p>
              </div>
              <FiCheckCircle className="text-3xl text-green-500" />
            </div>
          </div>
          {/* Earnings */}
          <div className="p-6 rounded-xl border-2 border-blue-400 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Est. Earnings</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">
                  ₹{dashboardData.totalEarnings}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                  Generated Revenue
                </p>
              </div>
              <FiDollarSign className="text-3xl text-blue-500" />
            </div>
          </div>
        </div>

        {/* Main Content - Today's & Upcoming Schedule */}
        <div className="grid grid-cols-1 ">
          {/* Today's Schedule */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-1">
              Today’s Schedule
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {todayPretty}
            </p>

            {todaysSessions.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg h-40 flex flex-col items-center justify-center text-gray-400">
                <FiCalendar className="text-3xl mb-2" />
                <p>No sessions scheduled for today.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full border rounded-xl bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Time</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Patient</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Therapy</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Booking ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysSessions.map((session, idx) => (
                      <tr key={session.appointmentId + session.slotTime + idx} className="border-t">
                        <td className="py-2 px-3">{session.slotTime}</td>
                        <td className="py-2 px-3">
                          {session.patientName} <span className="text-xs text-gray-400">({session.patientId})</span>
                        </td>
                        <td className="py-2 px-3">{session.therapyTypeName}</td>
                        <td className="py-2 px-3">{session.appointmentId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Sessions Table */}
          <div className="bg-white rounded-xl w-full shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              Upcoming Sessions
            </h3>
            {dashboardData.upcomingSessionDetails.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p>No upcoming sessions.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full border rounded-xl bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Date</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Time</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Patient</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Therapy</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Booking ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.upcomingSessionDetails.map((session, idx) => (
                      <tr key={session.appointmentId + session.date + session.slotTime + idx} className="border-t">
                        <td className="py-2 px-3">{session.date}</td>
                        <td className="py-2 px-3">{session.slotTime}</td>
                        <td className="py-2 px-3">
                          {session.patientName} <span className="text-xs text-gray-400">({session.patientId})</span>
                        </td>
                        <td className="py-2 px-3">{session.therapyTypeName}</td>
                        <td className="py-2 px-3">{session.appointmentId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
