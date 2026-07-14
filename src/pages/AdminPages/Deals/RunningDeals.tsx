
import React, { useEffect, useState, useMemo } from "react";
import { adminNotify } from "../../../utils/adminNotify";
import AdminPage from "../../../components/admin/AdminPage";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

const API_URL = import.meta.env.VITE_API_URL || "";

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

function dealImageUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL}/${path.replace(/^\/+/, "")}`;
}

const RunningDeals: React.FC = () => {
  const [deals, setDeals] = useState<RunningDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState([
    "image", "type", "servicePart", "description", "vehicle", "price", "endsOn", "createdBy",
  ]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/admin/deals/running`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || "Failed to fetch running deals");
        }
        return res.json();
      })
      .then((data) => {
        setDeals(data.data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        adminNotify.error(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return deals.filter((deal) => {
      const servicePart =
        deal.dealType === "Service"
          ? (deal.serviceId as Service)?.name || ""
          : deal.partName || "";
      const vehicle = deal.selectedVehicle
        ? `${deal.selectedVehicle.name} ${deal.selectedVehicle.model} ${deal.selectedVehicle.year}`
        : "Any";
      const createdBy = `${deal.createdBy?.businessName || ""} ${deal.createdBy?.businessEmail || ""}`;
      return (
        deal.dealType.toLowerCase().includes(q) ||
        servicePart.toLowerCase().includes(q) ||
        deal.description.toLowerCase().includes(q) ||
        vehicle.toLowerCase().includes(q) ||
        createdBy.toLowerCase().includes(q) ||
        String(deal.discountedPrice).includes(q)
      );
    });
  }, [deals, search]);

  const tableColumns = useMemo(
    () => [
      {
        key: "image",
        label: "Image",
        render: (deal: RunningDeal) =>
          tableCell(
            deal.dealImage ? (
              <img
                src={dealImageUrl(deal.dealImage)}
                alt="deal"
                style={{ height: 56, width: 80, borderRadius: 4, border: "1px solid #f1f5f9", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontStyle: "italic", color: "#bbb" }}>No Image</span>
            )
          ),
        exportValue: () => "—",
      },
      {
        key: "type",
        label: "Type",
        render: (deal: RunningDeal) =>
          tableCell(
            <span
              style={{
                display: "inline-block",
                borderRadius: 4,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 700,
                background: deal.dealType === "Service" ? "#28a745" : "#007bff",
                color: "#fff",
              }}
            >
              {deal.dealType}
            </span>
          ),
        exportValue: (deal: RunningDeal) => deal.dealType,
      },
      {
        key: "servicePart",
        label: "Service / Part",
        render: (deal: RunningDeal) =>
          tableCell(
            deal.dealType === "Service"
              ? (deal.serviceId as Service)?.name || "-"
              : deal.partName || "-"
          ),
        exportValue: (deal: RunningDeal) =>
          deal.dealType === "Service"
            ? (deal.serviceId as Service)?.name || "-"
            : deal.partName || "-",
      },
      {
        key: "description",
        label: "Description",
        render: (deal: RunningDeal) =>
          tableCell(deal.description || "-", undefined, { wrap: true }),
        exportValue: (deal: RunningDeal) => deal.description,
      },
      {
        key: "vehicle",
        label: "Vehicle",
        render: (deal: RunningDeal) =>
          tableCell(
            deal.selectedVehicle
              ? `${deal.selectedVehicle.name} ${deal.selectedVehicle.model} ${deal.selectedVehicle.year}`
              : <span style={{ color: "#bbb" }}>Any</span>
          ),
        exportValue: (deal: RunningDeal) =>
          deal.selectedVehicle
            ? `${deal.selectedVehicle.name} ${deal.selectedVehicle.model} ${deal.selectedVehicle.year}`
            : "Any",
      },
      {
        key: "price",
        label: "Price",
        render: (deal: RunningDeal) =>
          tableCell(<span style={{ fontWeight: 700, color: "#007bff" }}>${deal.discountedPrice}</span>),
        exportValue: (deal: RunningDeal) => String(deal.discountedPrice),
      },
      {
        key: "endsOn",
        label: "Ends On",
        render: (deal: RunningDeal) =>
          tableCell(
            new Date(deal.offerEndsOnDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          ),
        exportValue: (deal: RunningDeal) =>
          new Date(deal.offerEndsOnDate).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
      },
      {
        key: "createdBy",
        label: "Created By",
        render: (deal: RunningDeal) =>
          tableCell(
            <>
              <div style={{ fontWeight: 700, color: "#28a745" }}>{deal.createdBy.businessName || "Business"}</div>
              <div style={{ fontSize: 13, color: "#777" }}>
                {deal.createdBy.businessEmail || `ID: ${deal.createdBy._id}`}
              </div>
            </>
          ),
        exportValue: (deal: RunningDeal) =>
          `${deal.createdBy.businessName || "Business"} (${deal.createdBy.businessEmail || deal.createdBy._id})`,
      },
    ],
    []
  );

  return (
    <AdminPage title="Running Deals" noPanel>
      <p className="mb-6 text-sm text-gray-500">
        All currently active offers and deals for Auto Shop Owners
      </p>

      <div className="mb-10">
        <AdminDataTable
          items={filtered}
          columns={tableColumns}
          getRowId={(deal) => deal._id}
          loading={loading}
          error={error}
          emptyMessage="No running deals found."
          search={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          currentPage={currentPage}
          onCurrentPageChange={setCurrentPage}
          visibleColumnKeys={visibleCols}
          onVisibleColumnKeysChange={setVisibleCols}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          exportFilename="running-deals"
          totalBeforeFilter={deals.length}
        />
      </div>
    </AdminPage>
  );
};

export default RunningDeals;
