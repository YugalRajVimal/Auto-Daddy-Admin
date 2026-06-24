import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import useAuth from "../../auth/useAuth";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopGreenRow,
  ShopListPanel,
} from "../../components/shop/ShopPanels";
import ShopSupportPanel from "../../components/shop/ShopSupportPanel";
import type { ShopTicket } from "../../components/shop/ShopTicketRow";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";
import { useWebVoiceRecorder } from "../../hooks/useWebVoiceRecorder";
import { apiMessage, submitEnquiry } from "../../lib/shopOwnerMutations";

const HELP_SECTIONS = [
  { id: "ticket-raised", label: "Ticket Raised", variant: "primary" as const },
  { id: "resolved", label: "Resolved", variant: "secondary" as const },
];

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

type HelpSection = "ticket-raised" | "resolved";

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

export default function ShopHelpPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const { categories, loading: servicesLoading } = useShopServices();
  const { recording, audioBlob, error: recorderError, hasRecording, toggle, reset } =
    useWebVoiceRecorder();

  const [activeId, setActiveId] = useState<HelpSection>("ticket-raised");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tickets, setTickets] = useState<ShopTicket[]>(DEMO_TICKETS);
  const [draftTicketNo, setDraftTicketNo] = useState(nextTicketNo);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [saving, setSaving] = useState(false);

  const services = useMemo(
    () =>
      categories
        .map((c) => ({ id: c.id, name: c.name?.trim() || "" }))
        .filter((s) => s.id && s.name),
    [categories]
  );

  const resolvedServiceId = selectedServiceId || services[0]?.id || "";

  const filteredTickets = useMemo(
    () =>
      tickets.filter((t) =>
        activeId === "resolved" ? t.status === "resolved" : t.status === "active"
      ),
    [activeId, tickets]
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
    setActiveId(section);
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
    if (!token) {
      toast.error("Please sign in again.");
      return;
    }

    setSaving(true);
    try {
      const ext = audioBlob.type.includes("webm") ? "webm" : "m4a";
      const file = new File([audioBlob], `enquiry.${ext}`, { type: audioBlob.type });
      const res = await submitEnquiry(token, service.id, service.name, file);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not submit your enquiry.");
        return;
      }

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
      setActiveId("ticket-raised");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShopPageShell
      metaTitle="Help | AutoDaddy"
      metaDescription="Auto shop support and help tickets"
      sidebarItems={HELP_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={(id) => handleSectionChange(id as HelpSection)}
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
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
        <div className="flex min-h-[420px] flex-1 flex-col gap-3 lg:min-h-[calc(100vh-220px)]">
          {activeId === "ticket-raised" ? (
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
                activeId === "resolved"
                  ? "No resolved tickets yet."
                  : "No active tickets. Raise a ticket to get help."
              }
            />
          ) : (
            <ShopListPanel>
              {filteredTickets.map((ticket) => (
                <ShopGreenRow
                  key={ticket.id}
                  left={
                    <p className="text-sm font-bold text-white">
                      #{ticket.ticketNo}
                    </p>
                  }
                  center={
                    <div>
                      <p className="text-sm font-bold text-gray-900">{ticket.subject}</p>
                      <p className="text-xs text-gray-600">{ticket.date}</p>
                    </div>
                  }
                  right={
                    <p
                      className={`text-sm font-bold capitalize ${
                        ticket.status === "resolved" ? "text-gray-600" : "text-[#008000]"
                      }`}
                    >
                      {ticket.status === "resolved" ? "Resolved" : "Active"}
                    </p>
                  }
                />
              ))}
            </ShopListPanel>
          )}
        </div>
      )}
    </ShopPageShell>
  );
}
