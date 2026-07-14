import { FiMic, FiPause } from "react-icons/fi";
import DashboardPanelCard from "../COMP";
import {
  ownerVehicleLabelClass,
  ownerVehicleSelectClass,
} from "../owner/ownerVehicleFormUtils";
import { shopCompactInputClass } from "./shopLayoutStyles";

const INTRO =
  "Autodaddy is providing better solution to its user promptly. Any question that help to improve system would be respected. Only help of collaborative efforts makes the system strong.";

type ServiceOption = { id: string; name: string };

type ShopSupportPanelProps = {
  ticketNo: string;
  services: ServiceOption[];
  servicesLoading: boolean;
  selectedServiceId: string;
  onServiceChange: (id: string) => void;
  recording: boolean;
  hasRecording: boolean;
  recorderError: string | null;
  onToggleRecording: () => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  /** Soft glass styling for the car-owner portal. */
  ownerStyle?: boolean;
};

export default function ShopSupportPanel({
  ticketNo,
  services,
  servicesLoading,
  selectedServiceId,
  onServiceChange,
  recording,
  hasRecording,
  recorderError,
  onToggleRecording,
  saving,
  onSave,
  onCancel,
  ownerStyle = false,
}: ShopSupportPanelProps) {
  if (ownerStyle) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Raise Ticket</h2>
          <p className="mt-1 text-sm font-semibold text-ad-purple">Ticket No. {ticketNo}</p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className="mx-auto mb-8 max-w-xl text-center text-sm italic leading-relaxed text-slate-600">
            {INTRO}
          </p>

          <div className="mb-6">
            <label className={ownerVehicleLabelClass} htmlFor="support-subject">
              Subject
            </label>
            <select
              id="support-subject"
              value={selectedServiceId}
              onChange={(e) => onServiceChange(e.target.value)}
              disabled={servicesLoading || services.length === 0}
              className={`${ownerVehicleSelectClass} disabled:opacity-60`}
            >
              <option value="">{servicesLoading ? "Loading…" : "Choose a subject"}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className={`${ownerVehicleLabelClass} mb-2`}>Speak your message</p>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 ring-1 ring-black/5">
              <button
                type="button"
                onClick={onToggleRecording}
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                  recording
                    ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                    : "bg-white text-ad-purple ring-1 ring-slate-200 hover:bg-ad-bg-purple"
                }`}
                aria-label={recording ? "Stop recording" : "Start recording"}
              >
                {recording ? <FiPause size={16} /> : <FiMic size={16} />}
              </button>
              <div className="min-w-0 flex-1 border-b border-dashed border-slate-300 pb-1">
                {recording ? (
                  <span className="text-sm font-medium text-rose-600">
                    Recording… tap to stop
                  </span>
                ) : hasRecording ? (
                  <span className="text-sm font-medium text-emerald-600">Recording ready</span>
                ) : (
                  <span className="text-sm text-slate-500">Tap the mic to record your message</span>
                )}
              </div>
            </div>
            {recorderError ? (
              <p className="mt-2 text-sm text-rose-600">{recorderError}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-gradient-to-br from-ad-purple to-ad-purple-dark px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-sky-700 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardPanelCard variant="form" className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 border-b border-ad-form-border pb-3">
        <h2 className="text-lg font-bold text-ad-green-dark">Raise Ticket</h2>
        <p className="mt-1 text-sm font-semibold text-ad-green">Ticket No. {ticketNo}</p>
      </div>

      <div className="flex flex-1 flex-col">
        <p className="mx-auto mb-8 max-w-xl text-center text-sm italic leading-relaxed text-gray-600">
          {INTRO}
        </p>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-bold text-ad-green-dark" htmlFor="support-subject">
              Subject
            </label>
            <select
              id="support-subject"
              value={selectedServiceId}
              onChange={(e) => onServiceChange(e.target.value)}
              disabled={servicesLoading || services.length === 0}
              className={`${shopCompactInputClass} disabled:opacity-60`}
            >
              <option value="">{servicesLoading ? "Loading…" : "Subject"}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-2 text-xs font-bold text-ad-green-dark">
            Speak <span className="text-ad-green-dark">&gt;&gt;&gt;</span>
          </p>
          <div className="flex items-center gap-3 rounded border border-gray-400 bg-white px-4 py-3">
            <button
              type="button"
              onClick={onToggleRecording}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border ${
                recording
                  ? "border-red-400 bg-red-100 text-red-700"
                  : "border-ad-green-dark/40 bg-white text-ad-green-dark"
              }`}
              aria-label={recording ? "Stop recording" : "Start recording"}
            >
              <FiPause size={16} />
            </button>
            <div className="min-w-0 flex-1 border-b border-dashed border-gray-400 pb-1">
              {recording ? (
                <span className="text-sm font-medium text-red-600">Recording… tap pause to stop</span>
              ) : hasRecording ? (
                <span className="text-sm font-medium text-ad-green">Recording ready</span>
              ) : (
                <span className="text-sm text-gray-500">Tap to record your message</span>
              )}
            </div>
          </div>
          {recorderError ? <p className="mt-2 text-sm text-red-600">{recorderError}</p> : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-ad-form-border bg-ad-form-bg px-3 py-2.5">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded bg-ad-form-save px-4 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <span className="text-xs text-gray-700">
          or{" "}
          <button
            type="button"
            onClick={onCancel}
            className="font-medium text-blue-600 underline hover:text-blue-700"
          >
            Cancel
          </button>
        </span>
      </div>
    </DashboardPanelCard>
  );
}
