import { Modal } from "../ui/modal";

const HELP_INTRO =
  "autodaddy is providing better solution to its clients promptly. If you have any question about autodaddy feel free to generate ticket.";

type SupportHelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  ticketNo: string;
  subject: string;
  onSubjectChange: (value: string) => void;
  details: string;
  onDetailsChange: (value: string) => void;
  subjects: readonly string[];
  onSubmit: () => void;
};

export default function SupportHelpModal({
  isOpen,
  onClose,
  ticketNo,
  subject,
  onSubjectChange,
  details,
  onDetailsChange,
  subjects,
  onSubmit,
}: SupportHelpModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      align="top"
      overlayClassName="bg-black/35"
      className="relative mx-3 w-full max-w-[560px] overflow-hidden rounded-none bg-transparent p-0 shadow-none"
    >
      <div className="overflow-hidden rounded border border-gray-300 bg-white shadow-md">
        <div className="flex items-center justify-between border-b border-gray-300 bg-ad-bg-blue px-4 py-2">
          <h2 className="text-sm font-bold text-gray-900">Support (Help)</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-400 bg-white text-sm leading-none text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="mb-5 text-center text-sm leading-relaxed text-gray-600">{HELP_INTRO}</p>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Subject <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                className="h-9 min-w-[180px] flex-1 border border-gray-400 bg-white px-2 text-sm text-gray-800 focus:border-ad-blue-dark focus:outline-none sm:max-w-[280px]"
              >
                <option value="" disabled>
                  Select
                </option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="rounded-2xl bg-ad-bg-blue px-4 py-2 text-sm text-gray-500">
                Ticket No. {ticketNo || "—"}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => onDetailsChange(e.target.value)}
              rows={7}
              className="w-full resize-y border border-gray-400 bg-white px-2 py-2 text-sm text-gray-800 focus:border-ad-blue-dark focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-300 bg-ad-bg-blue px-4 py-2.5">
          <button
            type="button"
            onClick={onSubmit}
            className="rounded bg-ad-green px-4 py-1 text-sm font-semibold text-white hover:bg-ad-green-dark"
          >
            Submit
          </button>
          <span className="text-sm text-gray-800">or</span>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
