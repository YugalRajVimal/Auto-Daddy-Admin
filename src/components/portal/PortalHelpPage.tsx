import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../common/PageMeta";
import { PortalPageContent } from "../admin/PortalPageContent";
import OwnerFaqsDialog from "../owner/OwnerFaqsDialog";
import ShopHelpSidebar from "../shop/ShopHelpSidebar";
import ShopSupportPanel from "../shop/ShopSupportPanel";
import ShopTicketRow, { type ShopTicket } from "../shop/ShopTicketRow";
import { ShopEmptyPanel, ShopListPanel } from "../shop/ShopPanels";
import { useWebVoiceRecorder } from "../../hooks/useWebVoiceRecorder";

const DEMO_TICKETS: ShopTicket[] = [
  {
    id: "demo-1",
    ticketNo: "123456",
    date: "2026-06-21",
    subject: "Subject",
    status: "active",
  },
  {
    id: "demo-2",
    ticketNo: "123456",
    date: "2026-06-21",
    subject: "Subject",
    status: "resolved",
  },
];

export type HelpServiceOption = { id: string; name: string };

type PortalHelpPageProps = {
  metaDescription: string;
  faqsHeading: string;
  faqsDescription: string;
  services: HelpServiceOption[];
  servicesLoading: boolean;
  onSubmit: (service: HelpServiceOption, audio: Blob) => Promise<boolean>;
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
  faqsHeading,
  faqsDescription,
  services,
  servicesLoading,
  onSubmit,
}: PortalHelpPageProps) {
  const { recording, audioBlob, error: recorderError, hasRecording, toggle, reset } =
    useWebVoiceRecorder();

  const [activeSection, setActiveSection] = useState<HelpSection>("ticket-raised");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tickets, setTickets] = useState<ShopTicket[]>(DEMO_TICKETS);
  const [draftTicketNo, setDraftTicketNo] = useState(nextTicketNo);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [saving, setSaving] = useState(false);

  const resolvedServiceId = selectedServiceId || services[0]?.id || "";

  const filteredTickets = useMemo(
    () =>
      tickets.filter((t) =>
        activeSection === "resolved" ? t.status === "resolved" : t.status === "active"
      ),
    [activeSection, tickets]
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

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Help | AutoDaddy" description={metaDescription} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
        <ShopHelpSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onFaqsClick={() => setFaqsOpen(true)}
        />

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
          <div className="flex min-h-[420px] flex-1 flex-col gap-3 lg:min-h-[calc(100vh-220px)]">
            {activeSection === "ticket-raised" ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={openNewTicketForm}
                  className="rounded-full border border-[#006600] bg-[#006600] px-5 py-2 text-sm font-bold text-white hover:brightness-95"
                >
                  Raise Ticket
                </button>
              </div>
            ) : null}

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
      </div>

      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={() => setFaqsOpen(false)}
        heading={faqsHeading}
        description={faqsDescription}
      />
    </PortalPageContent>
  );
}
