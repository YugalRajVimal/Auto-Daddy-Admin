import { FiPause, FiX } from "react-icons/fi";

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
  onClose: () => void;
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
  onClose,
}: ShopSupportPanelProps) {
  return (
    <div className="flex min-h-[420px] flex-1 flex-col rounded-md border-2 border-ad-green-light bg-ad-green-light/40 lg:min-h-[calc(100vh-220px)]">
      <div className="flex items-center justify-between border-b border-ad-green-dark/30 px-5 py-3">
        <h2 className="text-lg font-bold text-ad-green-dark">Support</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-600 hover:bg-white/60"
          aria-label="Close support form"
        >
          <FiX size={20} />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-5 py-6">
        <p className="mx-auto mb-8 max-w-xl text-center text-sm italic leading-relaxed text-gray-600">
          {INTRO}
        </p>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="support-subject">
              Subject
            </label>
            <select
              id="support-subject"
              value={selectedServiceId}
              onChange={(e) => onServiceChange(e.target.value)}
              disabled={servicesLoading || services.length === 0}
              className="w-full rounded border border-ad-form-border bg-ad-form-bg px-4 py-2.5 text-sm text-gray-800 focus:border-ad-green focus:outline-none disabled:opacity-60"
            >
              <option value="">{servicesLoading ? "Loading…" : "Subject"}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="shrink-0 sm:w-[200px]">
            <div className="rounded border border-ad-form-border bg-ad-form-bg px-4 py-2.5 text-sm text-gray-700">
              Ticket No. {ticketNo}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-gray-800">
            Speak <span className="text-ad-green-dark">&gt;&gt;&gt;</span>
          </p>
          <div className="flex items-center gap-3 rounded border border-ad-form-border bg-ad-form-bg px-4 py-3">
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

      <div className="flex flex-wrap items-center gap-3 border-t border-ad-form-border bg-ad-form-bg px-5 py-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded bg-ad-green-dark px-6 py-2 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <span className="text-sm text-gray-700">
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
    </div>
  );
}
