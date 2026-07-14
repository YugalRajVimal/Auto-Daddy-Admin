import { useCallback, useMemo, useState, type ReactNode } from "react";
import { FiHelpCircle, FiPlus } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router";
import { toast } from "react-toastify";
import OwnerPageShell, { ownerPageIntroClass } from "../owner/OwnerPageShell";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
import ShopSupportPanel from "../shop/ShopSupportPanel";
import ShopTicketRow, { type ShopTicket } from "../shop/ShopTicketRow";
import { useWebVoiceRecorder } from "../../hooks/useWebVoiceRecorder";

type HelpSection = "ticket-raised" | "resolved";

const SECTION_BY_PATH: Record<string, HelpSection> = {
  "/owner/help": "ticket-raised",
  "/owner/help/resolved": "resolved",
};

const SECTION_META: Record<HelpSection, { title: string; subtitle: string }> = {
  "ticket-raised": {
    title: "Ticket Raised",
    subtitle: "Open support requests waiting for a response",
  },
  resolved: {
    title: "Resolved",
    subtitle: "Tickets that have already been closed",
  },
};

export type HelpServiceOption = { id: string; name: string };

type PortalHelpPageProps = {
  metaDescription: string;
  services: HelpServiceOption[];
  servicesLoading: boolean;
  onSubmit: (service: HelpServiceOption, audio: Blob) => Promise<boolean>;
  headerAction?: ReactNode;
};

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextTicketNo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function helpSectionFromPath(pathname: string): HelpSection {
  return SECTION_BY_PATH[pathname] ?? "ticket-raised";
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ad-purple/20 bg-white/60 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-ad-bg-purple text-ad-purple">
        <FiHelpCircle size={22} aria-hidden />
      </span>
      <div className="max-w-sm text-sm text-slate-600">{children}</div>
    </div>
  );
}

export default function PortalHelpPage({
  metaDescription,
  services,
  servicesLoading,
  onSubmit,
  headerAction,
}: PortalHelpPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { recording, audioBlob, error: recorderError, hasRecording, toggle, reset } =
    useWebVoiceRecorder();

  const activeSection = helpSectionFromPath(location.pathname);
  const [showForm, setShowForm] = useState(false);
  const [tickets, setTickets] = useState<ShopTicket[]>([]);
  const [draftTicketNo, setDraftTicketNo] = useState(nextTicketNo);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [saving, setSaving] = useState(false);

  const resetView = useCallback(() => {
    setShowForm(false);
    reset();
  }, [reset]);

  useOwnerNavReset(resetView);

  const resolvedServiceId = selectedServiceId || services[0]?.id || "";
  const meta = SECTION_META[activeSection];

  const filteredTickets = useMemo(
    () =>
      tickets.filter((t) =>
        activeSection === "resolved" ? t.status === "resolved" : t.status === "active",
      ),
    [activeSection, tickets],
  );

  const openNewTicketForm = useCallback(() => {
    setDraftTicketNo(nextTicketNo());
    reset();
    setSelectedServiceId(services[0]?.id ?? "");
    setShowForm(true);
  }, [reset, services]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    reset();
  }, [reset]);

  const handleSave = async () => {
    const service = services.find((s) => s.id === resolvedServiceId);
    if (!service) {
      toast.error("Please choose a subject.");
      return;
    }
    if (!audioBlob) {
      toast.error("Please record your message before saving.");
      return;
    }

    setSaving(true);
    try {
      const ok = await onSubmit(service, audioBlob);
      if (!ok) return;

      const newTicket: ShopTicket = {
        id: `ticket-${Date.now()}`,
        ticketNo: draftTicketNo,
        date: todayYMD(),
        subject: service.name,
        status: "active",
      };
      setTickets((prev) => [newTicket, ...prev]);
      toast.success("Support ticket raised.");
      closeForm();
      if (location.pathname !== "/owner/help") {
        navigate("/owner/help", { replace: true });
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const raiseTicketButton =
    activeSection === "ticket-raised" && !showForm ? (
      <button
        type="button"
        onClick={openNewTicketForm}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-br from-ad-purple to-ad-purple-dark px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(155,48,141,0.28)] transition hover:brightness-105"
      >
        <FiPlus size={15} aria-hidden />
        Raise Ticket
      </button>
    ) : undefined;

  return (
    <OwnerPageShell
      pageHeading=""
      metaTitle="Help | AutoDaddy"
      metaDescription={metaDescription}
      noPanel
      headerAction={headerAction ?? raiseTicketButton}
    >
      <div className="flex flex-col gap-4">
        {!showForm ? (
          <header className={`${ownerPageIntroClass} flex flex-wrap items-end justify-between gap-3`}>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">{meta.subtitle}</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {meta.title}
              </h1>
            </div>
            {filteredTickets.length > 0 ? (
              <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/5">
                {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </header>
        ) : null}

        {showForm ? (
          <ShopSupportPanel
            ownerStyle
            ticketNo={draftTicketNo}
            services={services}
            servicesLoading={servicesLoading}
            selectedServiceId={resolvedServiceId}
            onServiceChange={setSelectedServiceId}
            recording={recording}
            hasRecording={hasRecording}
            recorderError={recorderError}
            onToggleRecording={() => void toggle()}
            saving={saving}
            onSave={() => void handleSave()}
            onCancel={closeForm}
          />
        ) : filteredTickets.length === 0 ? (
          <EmptyState>
            {activeSection === "resolved" ? (
              "No resolved tickets yet."
            ) : (
              <>
                <p className="mb-3">No active tickets. Raise a ticket to get help.</p>
                <button
                  type="button"
                  onClick={openNewTicketForm}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-ad-purple to-ad-purple-dark px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-105"
                >
                  <FiPlus size={14} aria-hidden />
                  Raise Ticket
                </button>
              </>
            )}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredTickets.map((ticket) => (
              <ShopTicketRow key={ticket.id} ticket={ticket} ownerStyle />
            ))}
          </div>
        )}
      </div>
    </OwnerPageShell>
  );
}
