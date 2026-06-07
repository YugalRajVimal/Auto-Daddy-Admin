import React from "react";

// Data interface for the website entry
interface WebsiteData {
  id: string;
  shopName: string;
  mobile: string;
  domainName: string;
  templateSelected: string;
  daysLeft: number;
  status: string;
}

// Example data (from prompt)
const sampleData: WebsiteData = {
  id: "6a07e3bcc5cf0f66748145c5",
  shopName: "New auto shop",
  mobile: "7817089765",
  domainName: "abc.com",
  templateSelected: "Sample Template Two",
  daysLeft: 349,
  status: "Pending",
};

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-700",
  Archived: "bg-gray-200 text-gray-500",
};

const WebsiteTemplates: React.FC = () => {
  const data = sampleData; // If you want to display more, use an array and map

  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">Website Data</h2>
      </div>
      <div className="overflow-x-auto mt-2">
        <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
          <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
            <tr>
              <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Shop Name</th>
              <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Mobile</th>
              <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Domain Name</th>
              <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Template Selected</th>
              <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Days Left</th>
              <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Status</th>
              <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">ID</th>
            </tr>
          </thead>
          <tbody>
            <tr className="transition border-b group last:border-b-0 hover:bg-blue-50">
              <td className="px-3 py-3 whitespace-nowrap font-medium">{data.shopName}</td>
              <td className="px-3 py-3 whitespace-nowrap">{data.mobile}</td>
              <td className="px-3 py-3 whitespace-nowrap">{data.domainName}</td>
              <td className="px-3 py-3 whitespace-nowrap">{data.templateSelected}</td>
              <td className="px-3 py-3 whitespace-nowrap">{data.daysLeft}</td>
              <td className="px-3 py-3 whitespace-nowrap">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    statusColors[data.status] || "bg-gray-50 text-gray-500"
                  }`}
                >
                  {data.status}
                </span>
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">{data.id}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WebsiteTemplates;