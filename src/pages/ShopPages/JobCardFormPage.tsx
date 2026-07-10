import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import AttachImageCheckbox from "../../components/admin/AttachImageCheckbox";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
} from "../../components/admin/ContentPanel";
import { shopCompactInputClass } from "../../components/shop/shopLayoutStyles";
import { useAuth } from "../../auth";
import { fetchJobCardFormData, fetchJobCardByIdForForm, resolveJobCardFromApiResponse, saveJobCard, normalizeJobCardServiceBlocks } from "../../lib/shopOwnerJobCardsApi";
import { useShopServices } from "../../hooks/useShopServices";
import type { MyCustomer } from "../../types/shopOwner";
import { ShopFormPage } from "../../components/shop/forms/ShopFormPage";

type ServiceLine = {
  catId: string;
  subIdx: number;
  name: string;
  qty: string;
  unitPrice: string;
  labour: string;
};

type JobCardEditRaw = Record<string, unknown>;

function vehicleId(v: { vId?: string; _id?: string; id?: string }) {
  return v.vId ?? v._id ?? v.id ?? "";
}

function parseAmount(v: string): number {
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function apiServiceBlocksToLines(
  blocks: unknown,
  categories: { id: string; name?: string; subServices: { name: string; price: number }[] }[]
): ServiceLine[] {
  if (!Array.isArray(blocks)) return [];
  const lines: ServiceLine[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const b = block as Record<string, unknown>;
    const catId = String(b.service ?? "").trim();
    if (!catId) continue;
    const cat = categories.find((c) => c.id === catId);
    if (!cat) continue;
    const subs = Array.isArray(b.subServices) ? b.subServices : [];
    for (const ss of subs) {
      if (!ss || typeof ss !== "object") continue;
      const s = ss as Record<string, unknown>;
      const subName = String(s.name ?? "").trim();
      if (!subName) continue;
      const subIdx = cat.subServices.findIndex((x) => x.name === subName);
      if (subIdx < 0) continue;
      const qtyStr = String(s.qty ?? s.unit ?? "1");
      const labour = String(s.labourCost ?? s.labourCharge ?? "0");
      const savedTotal = parseAmount(String(s.price ?? ""));
      const qty = parseAmount(qtyStr) || 1;
      const labourN = parseAmount(labour);
      let unitPrice = s.unitPrice != null ? String(s.unitPrice) : "";
      if (!unitPrice && savedTotal > 0 && qty > 0) {
        unitPrice = String((savedTotal - labourN) / qty);
      } else if (!unitPrice) {
        unitPrice = String(cat.subServices[subIdx]?.price ?? 0);
      }
      lines.push({
        catId,
        subIdx,
        name: `${cat.name ?? "Service"} — ${subName}`,
        qty: qtyStr,
        unitPrice,
        labour,
      });
    }
  }
  return lines;
}

function hydrateFromRaw(
  raw: JobCardEditRaw,
  categories: { id: string; name?: string; subServices: { name: string; price: number }[] }[]
) {
  const customerRef = raw.customerId;
  const vehicleRef = raw.vehicleId;
  const customerId =
    customerRef && typeof customerRef === "object"
      ? String((customerRef as Record<string, unknown>)._id ?? "")
      : String(raw.customerId ?? "");
  const vehicleIdVal =
    vehicleRef && typeof vehicleRef === "object"
      ? String((vehicleRef as Record<string, unknown>)._id ?? "")
      : String(raw.vehicleId ?? "");
  const odomIn = String(raw.odoIn ?? raw.odometerReading ?? "0");
  const odomOut = String(raw.dueOdometerReading ?? "0");
  const discount = String(raw.otherCharges ?? raw.labourDuration ?? "");
  const lines = apiServiceBlocksToLines(raw.services, categories);
  const editingId = String(raw._id ?? raw.id ?? "");
  return { customerId, vehicleIdVal, odomIn, odomOut, discount, lines, editingId };
}

function JobCardForm({ editRaw }: { editRaw?: JobCardEditRaw | null }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { categories } = useShopServices();
  const [customers, setCustomers] = useState<MyCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [vehicleIdVal, setVehicleIdVal] = useState("");
  const [odomIn, setOdomIn] = useState("");
  const [odomOut, setOdomOut] = useState("");
  const [discount, setDiscount] = useState("");
  const [lines, setLines] = useState<ServiceLine[]>([]);
  const [attachVehiclePhotos, setAttachVehiclePhotos] = useState(false);
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingJobCardId, setEditingJobCardId] = useState<string | null>(null);

  const isEdit = Boolean(editingJobCardId);

  useEffect(() => {
    if (!token) return;
    void fetchJobCardFormData(token)
      .then((data) => {
        setCustomers(
          data.myCustomers.map(
            (c): MyCustomer => ({
              carOwnerId: c._id,
              id: c._id,
              _id: c._id,
              name: c.name,
              phone: c.phone,
              countryCode: c.countryCode,
              city: c.city,
              vehicles: (c.myVehicles ?? []).map((v) => ({
                ...v,
                vId: v._id,
                year: v.year != null ? String(v.year) : undefined,
                odometerReading:
                  v.odometerReading != null ? String(v.odometerReading) : undefined,
                dueOdometerReading:
                  v.dueOdometerReading != null ? String(v.dueOdometerReading) : undefined,
              })),
            }),
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!editRaw || categories.length === 0) return;
    const services = normalizeJobCardServiceBlocks(editRaw);
    const h = hydrateFromRaw({ ...editRaw, services }, categories);
    if (h.editingId) setEditingJobCardId(h.editingId);
    setCustomerId(h.customerId);
    setVehicleIdVal(h.vehicleIdVal);
    setOdomIn(h.odomIn);
    setOdomOut(h.odomOut);
    setDiscount(h.discount);
    if (h.lines.length > 0) setLines(h.lines);
  }, [editRaw, categories]);

  const selectedCustomer = customers.find((c) => (c.carOwnerId ?? c.id ?? c._id) === customerId);
  const vehicles = selectedCustomer?.vehicles ?? [];

  const subOptions = useMemo(() => {
    const out: Array<{ key: string; catId: string; subIdx: number; label: string; price: number }> = [];
    for (const cat of categories) {
      cat.subServices.forEach((sub, subIdx) => {
        out.push({
          key: `${cat.id}:${subIdx}`,
          catId: cat.id,
          subIdx,
          label: `${cat.name ?? "Service"} — ${sub.name}`,
          price: sub.price,
        });
      });
    }
    return out;
  }, [categories]);

  const addLine = (key: string) => {
    const opt = subOptions.find((o) => o.key === key);
    if (!opt) return;
    if (lines.some((l) => l.catId === opt.catId && l.subIdx === opt.subIdx)) return;
    setLines((prev) => [
      ...prev,
      {
        catId: opt.catId,
        subIdx: opt.subIdx,
        name: opt.label,
        qty: "1",
        unitPrice: String(opt.price),
        labour: "0",
      },
    ]);
  };

  const labourTotal = lines.reduce((sum, l) => {
    const qty = Number(l.qty) || 0;
    const unit = Number(l.unitPrice) || 0;
    const labour = Number(l.labour) || 0;
    return sum + qty * unit + labour;
  }, 0);

  const buildServicesJson = () => {
    const map = new Map<string, Array<Record<string, unknown>>>();
    for (const line of lines) {
      const cat = categories.find((c) => c.id === line.catId);
      const sub = cat?.subServices[line.subIdx];
      if (!sub) continue;
      const bucket = map.get(line.catId) ?? [];
      const qty = line.qty || "1";
      const unitPrice = Number(line.unitPrice) || 0;
      const labour = Number(line.labour) || 0;
      const price = (Number(qty) || 0) * unitPrice + labour;
      bucket.push({
        name: sub.name,
        desc: sub.desc,
        qty,
        unit: qty,
        unitPrice,
        price,
        labourCost: labour,
        labourCharge: labour,
      });
      map.set(line.catId, bucket);
    }
    return JSON.stringify([...map.entries()].map(([service, subServices]) => ({ service, subServices })));
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (!customerId || !vehicleIdVal) {
      toast.error("Select a customer and vehicle.");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one service.");
      return;
    }
    setSubmitting(true);
    try {
      const services = JSON.parse(buildServicesJson()) as unknown[];
      await saveJobCard(
        token,
        {
          jobCardId: editingJobCardId ?? undefined,
          sendForApproval: !isEdit,
          form: {
            customerId,
            vehicleId: vehicleIdVal,
            odometerReading: odomIn || "0",
            dueOdometerReading: odomOut || "0",
            issueDescription: "Walk-in / scheduled service",
            serviceType: "Repair",
            priorityLevel: "Normal",
            services,
            labourCharge: String(labourTotal),
            labourDuration: discount || "0",
            technicalRemarks: discount ? `Discount: ${discount}` : "",
          },
          vehiclePhotoFiles: attachVehiclePhotos && vehiclePhotoFile ? [vehiclePhotoFile] : [],
        },
        categories,
      );
      toast.success(`Job card ${isEdit ? "updated" : "created"}.`);
      navigate("/shop/job-cards");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${isEdit ? "update" : "create"} job card.`);
    } finally {
      setSubmitting(false);
    }
  };

  const title = isEdit ? "Edit Job Card" : "New Job Card";

  if (loading) {
    return (
      <ShopFormPage title={title} metaTitle={`${title} | AutoDaddy`} backTo="/shop/job-cards">
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      </ShopFormPage>
    );
  }

  return (
    <ShopFormPage title={title} metaTitle={`${title} | AutoDaddy`} backTo="/shop/job-cards">
      <CompactFormPanel
        focusOnMount
        footer={
          <CompactFormFooter
            actionLabel={submitting ? "Saving…" : isEdit ? "Update Job Card" : "Create Job Card"}
            onSave={() => void handleSubmit()}
            onCancel={() => navigate("/shop/job-cards")}
          />
        }
      >
        <CompactFormRow>
          <CompactField label="Customer" required>
            <select
              className={shopCompactInputClass}
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setVehicleIdVal("");
              }}
              disabled={isEdit}
            >
              <option value="">Select customer</option>
              {customers.map((c) => {
                const id = c.carOwnerId ?? c.id ?? c._id ?? "";
                return (
                  <option key={id} value={id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                );
              })}
            </select>
          </CompactField>
          <CompactField label="Vehicle" required>
            <select
              className={shopCompactInputClass}
              value={vehicleIdVal}
              onChange={(e) => setVehicleIdVal(e.target.value)}
              disabled={isEdit}
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v) => {
                const id = vehicleId(v);
                return (
                  <option key={id} value={id}>
                    {v.licensePlateNo || v.vehicleName} {v.model}
                  </option>
                );
              })}
            </select>
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="ODO IN">
            <input className={shopCompactInputClass} value={odomIn} onChange={(e) => setOdomIn(e.target.value)} />
          </CompactField>
          <CompactField label="ODO OUT">
            <input className={shopCompactInputClass} value={odomOut} onChange={(e) => setOdomOut(e.target.value)} />
          </CompactField>
          <CompactField label="Discount">
            <input className={shopCompactInputClass} value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </CompactField>
        </CompactFormRow>

        <div className="border-t border-gray-300 pt-4">
          <CompactField label="Add service line">
            <select
              className={shopCompactInputClass}
              defaultValue=""
              onChange={(e) => {
                addLine(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">Select sub-service…</option>
              {subOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </CompactField>
          <div className="mt-3 space-y-2">
            {lines.map((line, i) => (
              <div
                key={`${line.catId}-${line.subIdx}`}
                className="grid gap-2 rounded border border-gray-300 bg-white p-2 sm:grid-cols-5"
              >
                <p className="text-xs font-semibold text-ad-purple sm:col-span-5">{line.name}</p>
                <input
                  className={shopCompactInputClass}
                  placeholder="Qty"
                  value={line.qty}
                  onChange={(e) =>
                    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, qty: e.target.value } : l)))
                  }
                />
                <input
                  className={shopCompactInputClass}
                  placeholder="Unit price"
                  value={line.unitPrice}
                  onChange={(e) =>
                    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, unitPrice: e.target.value } : l)))
                  }
                />
                <input
                  className={shopCompactInputClass}
                  placeholder="Labour"
                  value={line.labour}
                  onChange={(e) =>
                    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, labour: e.target.value } : l)))
                  }
                />
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <CompactFormRow className="mt-4 items-start">
          <AttachImageCheckbox
            label="Attach Image"
            checked={attachVehiclePhotos}
            onCheckedChange={setAttachVehiclePhotos}
            file={vehiclePhotoFile}
            onFileChange={setVehiclePhotoFile}
          />
        </CompactFormRow>
      </CompactFormPanel>
    </ShopFormPage>
  );
}

export default function ShopJobCardAddPage() {
  return <JobCardForm />;
}

export function ShopJobCardEditPage() {
  const { id } = useParams();
  const location = useLocation();
  const { token } = useAuth();
  const stateRaw = (location.state as { jobCard?: JobCardEditRaw } | null)?.jobCard ?? null;
  const [fetchedRaw, setFetchedRaw] = useState<JobCardEditRaw | null>(null);
  const [fetching, setFetching] = useState(Boolean(id && !stateRaw));

  useEffect(() => {
    if (!token || !id || stateRaw) return;
    setFetching(true);
    void fetchJobCardByIdForForm(token, id).then((data) => {
      const job = resolveJobCardFromApiResponse(data);
      if (job) {
        setFetchedRaw({ ...job, _id: job._id ?? id });
      }
      setFetching(false);
    });
  }, [id, stateRaw, token]);

  const editRaw = stateRaw ?? fetchedRaw;

  if (fetching) {
    return (
      <ShopFormPage title="Edit Job Card" metaTitle="Edit Job Card | AutoDaddy" backTo="/shop/job-cards">
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      </ShopFormPage>
    );
  }

  if (!editRaw) {
    return (
      <ShopFormPage title="Edit Job Card" metaTitle="Edit Job Card | AutoDaddy" backTo="/shop/job-cards">
        <p className="text-sm text-white/85">Job card not found.</p>
      </ShopFormPage>
    );
  }

  return <JobCardForm editRaw={editRaw} />;
}
