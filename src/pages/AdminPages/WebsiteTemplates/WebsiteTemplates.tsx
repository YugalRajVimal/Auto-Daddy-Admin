

import React from "react";

interface WebsiteData {
  id: string;
  shopName: string;
  mobile: string;
  domainName: string;
  templateSelected: string;
  daysLeft: number;
  status: string;
}

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
  Pending: "bg-[#ffc107] text-white",
  Approved: "bg-[#28a745] text-white",
  Archived: "bg-[#aaa] text-white",
};

const WebsiteTemplates: React.FC = () => {
  const data = sampleData;

  return (
    <div
    // You may use Tailwind class if setup, or fallback to CSS below.
    className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans"
  
  >
      {/* Heading */}
      <h1 className="mb-6 text-[52px] font-light text-[#333]">
        Website Data
      </h1>

      {/* Card */}
      <div className="mb-10 overflow-hidden rounded border border-[#d2d6de] bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-[#f4f4f4] px-6 py-4">
          <h3 className="text-[18px] font-normal text-[#444]">
            Website List
          </h3>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">
                    Shop Name
                  </th>
                  <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">
                    Mobile
                  </th>
                  <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">
                    Domain Name
                  </th>
                  <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">
                    Template Selected
                  </th>
                  <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">
                    Days Left
                  </th>
                  <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">
                    Status
                  </th>
                  <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">
                    ID
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="border border-[#d2d6de] px-4 py-5 font-medium">
                    {data.shopName}
                  </td>
                  <td className="border border-[#d2d6de] px-4 py-5">
                    {data.mobile}
                  </td>
                  <td className="border border-[#d2d6de] px-4 py-5">
                    {data.domainName}
                  </td>
                  <td className="border border-[#d2d6de] px-4 py-5">
                    {data.templateSelected}
                  </td>
                  <td className="border border-[#d2d6de] px-4 py-5">
                    {data.daysLeft}
                  </td>
                  <td className="border border-[#d2d6de] px-4 py-5">
                    <span
                      className={`inline-block rounded px-3 py-1 text-xs font-bold ${
                        statusColors[data.status] || "bg-[#777] text-white"
                      }`}
                    >
                      {data.status}
                    </span>
                  </td>
                  <td className="border border-[#d2d6de] px-4 py-5 text-xs text-[#777]">
                    {data.id}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[15px] text-[#333]">
              Showing 1 to 1 of 1 entries
            </p>

            <div className="flex">
              <button className="border border-[#ddd] bg-white px-4 py-2 text-[#777]">
                Previous
              </button>
              <button className="border border-[#007bff] bg-[#007bff] px-4 py-2 text-white">
                1
              </button>
              <button className="border border-[#ddd] bg-white px-4 py-2 text-[#777]">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteTemplates;