import { useCallback, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import OwnerPageShell from "../owner/OwnerPageShell";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
import ShopSupportPanel from "../shop/ShopSupportPanel";
import ShopTicketRow, { type ShopTicket } from "../shop/ShopTicketRow";
import { ShopEmptyPanel, ShopListPanel } from "../shop/ShopPanels";
import { useWebVoiceRecorder } from "../../hooks/useWebVoiceRecorder";

const HELP_SECTIONS = [
  { id: "ticket-raised", label: "Ticket Raised", variant: "primary" as const },
  { id: "resolved", label: "Resolved", variant: "primary" as const },
];

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

type HelpSection = "ticket-raised" | "resolved";

export default function PortalHelpPage({
  metaDescription,
  services,
  servicesLoading,
  onSubmit,
  headerAction,
}: PortalHelpPageProps) {
  const { recording, audioBlob, error: recorderError, hasRecording, toggle, reset } =
    useWebVoiceRecorder();

  const [activeSection, setActiveSection] = useState<HelpSection>("ticket-raised");
  const [showForm, setShowForm] = useState(false);
  const [tickets, setTickets] = useState<ShopTicket[]>([]);
  const [draftTicketNo, setDraftTicketNo] = useState(nextTicketNo);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [saving, setSaving] = useState(false);

  const resetSidebar = useCallback(() => {
    setActiveSection("ticket-raised");
    setShowForm(false);
    reset();
  }, [reset]);

  useOwnerNavReset(resetSidebar);

  const resolvedServiceId = selectedServiceId || services[0]?.id || "";

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

  const handleSectionChange = (section: HelpSection) => {
    setActiveSection(section);
    setShowForm(false);
    reset();
  };

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
      setActiveSection("ticket-raised");
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
        className="shrink-0 rounded-full border border-[#006600] bg-[#006600] px-5 py-2 text-sm font-bold text-white hover:brightness-95"
      >
        Raise Ticket
      </button>
    ) : undefined;

  return (
    <OwnerPageShell
      pageHeading={activeSection === "resolved" ? "Resolved" : "Ticket Raised"}
      metaTitle="Help | AutoDaddy"
      metaDescription={metaDescription}
      headerAction={headerAction ?? raiseTicketButton}
      sidebarItems={HELP_SECTIONS}
      activeSidebarId={activeSection}
      onSidebarSelect={(id) => handleSectionChange(id as HelpSection)}
    >
      {showForm ? (
        <ShopSupportPanel
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
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTickets.length === 0 ? (
            <ShopEmptyPanel
              message={
                activeSection === "resolved"
                  ? "No resolved tickets yet."
                  : "No active tickets. Raise a ticket to get help."
              }
            />
          ) : (
            <ShopListPanel>
              {filteredTickets.map((ticket) => (
                <ShopTicketRow key={ticket.id} ticket={ticket} />
              ))}
            </ShopListPanel>
          )}
        </div>
      )}
    </OwnerPageShell>
  );
}
