

import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Interfaces
interface Service {
  _id: string;
  name: string;
}
interface Vehicle {
  id: string;
  name: string;
  model: string;
  year: string;
}
interface CreatedBy {
  _id: string;
  businessName?: string;
  businessEmail?: string;
}
interface RunningDeal {
  _id: string;
  dealType: string;
  serviceId?: Service;
  partName?: string;
  description: string;
  selectedVehicle?: {
    id?: Vehicle;
    name: string;
    model: string;
    year: string;
  };
  discountedPrice: number;
  offerEndsOnDate: string;
  createdBy: CreatedBy;
  dealImage?: string | null;
}

const RunningDeals: React.FC = () => {
  const [deals, setDeals] = useState<RunningDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/admin/deals/running`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || 'Failed to fetch running deals');
        }
        return res.json();
      })
      .then((data) => {
        setDeals(data.data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
<div
        // You may use Tailwind class if setup, or fallback to CSS below.
        className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 md:px-6 md:py-5 font-sans"
      
      >
      {/* Heading */}
      <h1 className="mb-1 text-xl md:text-2xl font-bold text-ad-green mb-4">Running Deals</h1>
      <p className="mb-6 text-[15px] text-[#777]">
        All currently active offers and deals for Auto Shop Owners
      </p>

      {/* Card */}
      <div className="mb-10 overflow-hidden rounded border border-[#d2d6de] bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-[#f4f4f4] px-6 py-4">
          <h3 className="text-[18px] font-normal text-[#444]">Deals List</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="lds-ring mr-3"><div /><div /><div /><div /></div>
              <span className="text-[16px] text-[#555]">Loading running deals...</span>
              <style>{`
                .lds-ring {
                  display: inline-block;
                  position: relative;
                  width: 32px;
                  height: 32px;
                }
                .lds-ring div {
                  box-sizing: border-box;
                  display: block;
                  position: absolute;
                  width: 24px;
                  height: 24px;
                  margin: 4px;
                  border: 3px solid #007bff;
                  border-radius: 50%;
                  animation: lds-ring 1s linear infinite;
                  border-color: #007bff transparent transparent transparent;
                }
                .lds-ring div:nth-child(1) { animation-delay: -0.45s; }
                .lds-ring div:nth-child(2) { animation-delay: -0.3s; }
                .lds-ring div:nth-child(3) { animation-delay: -0.15s; }
                @keyframes lds-ring {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {error && (
            <div className="rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-3 text-[#721c24]">
              Error: {error}
            </div>
          )}

          {!loading && !error && deals.length === 0 && (
            <div className="rounded border border-dashed border-[#d2d6de] bg-[#f9fafc] p-10 text-center text-[17px] text-[#777]">
              No running deals found.
            </div>
          )}

          {!loading && !error && deals.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Image</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Type</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Service / Part</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Description</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Vehicle</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Price</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Ends On</th>
                      <th className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold">Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => (
                      <tr key={deal._id}>
                        <td className="border border-[#d2d6de] px-4 py-5">
                          {deal.dealImage ? (
                            <img
                              src={
                                deal.dealImage.startsWith('http')
                                  ? deal.dealImage
                                  : `${API_URL}/${deal.dealImage.replace(/^\/+/, '')}`
                              }
                              alt="deal"
                              className="h-14 w-20 rounded border border-[#f1f5f9] object-cover"
                            />
                          ) : (
                            <span className="italic text-[#bbb]">No Image</span>
                          )}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5">
                          <span
                            className={`inline-block rounded px-3 py-1 text-xs font-bold ${
                              deal.dealType === 'Service'
                                ? 'bg-[#28a745] text-white'
                                : 'bg-[#007bff] text-white'
                            }`}
                          >
                            {deal.dealType}
                          </span>
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5">
                          {deal.dealType === 'Service'
                            ? (deal.serviceId as Service)?.name || '-'
                            : deal.partName || '-'}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5 max-w-[260px]" title={deal.description}>
                          {deal.description.length > 70 ? `${deal.description.slice(0, 67)}...` : deal.description}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5">
                          {deal.selectedVehicle
                            ? `${deal.selectedVehicle.name} ${deal.selectedVehicle.model} ${deal.selectedVehicle.year}`
                            : <span className="text-[#bbb]">Any</span>}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5 font-bold text-[#007bff]">
                          ${deal.discountedPrice}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5">
                          {new Date(deal.offerEndsOnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        <td className="border border-[#d2d6de] px-4 py-5">
                          <div className="font-bold text-[#28a745]">{deal.createdBy.businessName || 'Business'}</div>
                          <div className="text-[13px] text-[#777]">
                            {deal.createdBy.businessEmail || `ID: ${deal.createdBy._id}`}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-[15px] text-[#333]">
                  Showing 1 to {deals.length} of {deals.length} entries
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunningDeals;