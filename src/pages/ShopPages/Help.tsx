import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import useAuth from "../../auth/useAuth";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopListFooter } from "../../components/shop/ShopPanels";
import ShopSupportPanel from "../../components/shop/ShopSupportPanel";
import type { ShopTicket } from "../../components/shop/ShopTicketRow";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";
import { useWebVoiceRecorder } from "../../hooks/useWebVoiceRecorder";
import { apiMessage, submitEnquiry } from "../../lib/shopOwnerMutations";

const PAGE_SIZE = 10;
const HELP_SEARCH_INPUT_ID = "shop-help-search";

type HelpSection = "ticket-raised" | "resolved";

const HELP_SECTIONS = [
  { id: "ticket-raised", label: "Ticket Raised", variant: "primary" as const },
  { id: "resolved", label: "Resolved", variant: "primary" as const },
];

const SECTION_HEADINGS: Record<HelpSection, string> = {
  "ticket-raised": "Ticket Raised",
  resolved: "Resolved",
};

const EMPTY_MESSAGES: Record<HelpSection, string> = {
  "ticket-raised": "No active tickets. Raise a ticket to get help.",
  resolved: "No resolved tickets yet.",
};

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

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
};

const SHOP_TABLE_HEAD_TH_CLASS = `${SHOP_TABLE.th} h-9 py-0 align-middle`;
const SHOP_TABLE_BODY_TD_CLASS = `${SHOP_TABLE.td} h-9 py-0 align-middle whitespace-nowrap`;

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

function ticketStatusLabel(status: ShopTicket["status"]): string {
  return status === "resolved" ? "Resolved" : "Active";
}

function matchesTicketSearch(ticket: ShopTicket, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [ticket.ticketNo, ticket.subject, ticket.date, ticketStatusLabel(ticket.status)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={shopAddNewButtonClass}>
      + Raise Ticket
    </button>
  );
}

function HelpSearchBar({
  value,
  onChange,
  trailing,
}: {
  value: string;
  onChange: (value: string) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-2 py-1.5 sm:gap-3">
      <div className="flex flex-wrap items-center gap-2" />
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <input
          id={HELP_SEARCH_INPUT_ID}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          aria-label="Search"
          className="h-[26px] min-w-[9rem] border border-gray-400 bg-white px-2 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
        />
        {trailing}
      </div>
    </div>
  );
}

function HelpTicketTable({ rows }: { rows: ShopTicket[] }) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Ticket No.</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Subject</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((ticket, index) => (
              <tr key={ticket.id} className={adminPanelRowClass(index)}>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                  #{ticket.ticketNo}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                  {ticket.subject}
                </td>
                <td className={SHOP_TABLE_BODY_TD_CLASS}>{ticket.date}</td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                  {ticketStatusLabel(ticket.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default function ShopHelpPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const { categories, loading: servicesLoading } = useShopServices();
  const { recording, audioBlob, error: recorderError, hasRecording, toggle, reset } =
    useWebVoiceRecorder();

  const [activeId, setActiveId] = useState<HelpSection>("ticket-raised");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
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
    [categories],
  );

  const resolvedServiceId = selectedServiceId || services[0]?.id || "";

  const filteredTickets = useMemo(() => {
    const sectionTickets = tickets.filter((t) =>
      activeId === "resolved" ? t.status === "resolved" : t.status === "active",
    );
    return search.trim()
      ? sectionTickets.filter((ticket) => matchesTicketSearch(ticket, search))
      : sectionTickets;
  }, [activeId, tickets, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedList = useMemo(
    () => filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredTickets, safePage],
  );

  const pageHeading = showForm ? "Raise Ticket" : SECTION_HEADINGS[activeId];
  const activeSidebarId = showForm ? null : activeId;

  useEffect(() => {
    setPage(1);
  }, [search, activeId]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
      title="Help"
      pageHeading={pageHeading}
      metaTitle="Help | AutoDaddy"
      metaDescription="Auto shop support and help tickets"
      sidebarVariant="nav"
      sidebarItems={HELP_SECTIONS}
      activeSidebarId={activeSidebarId}
      onSidebarSelect={(id) => handleSectionChange(id as HelpSection)}
      heroBackgroundImage={false}
      contentTopOffset
      heroCardFlush
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="space-y-1">
        <ShopReveal show={showForm}>
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
        </ShopReveal>

        {!showForm ? (
          <>
            <HelpSearchBar
              value={search}
              onChange={setSearch}
              trailing={
                activeId === "ticket-raised" ? <AddNewButton onClick={openNewTicketForm} /> : null
              }
            />

            {filteredTickets.length === 0 ? (
              <p className="text-center text-sm text-gray-600">{EMPTY_MESSAGES[activeId]}</p>
            ) : (
              <>
                <HelpTicketTable rows={paginatedList} />

                <ShopListFooter className="text-sm font-semibold text-gray-600">
                  <p>{filteredTickets.length} Entries</p>
                  {totalPages > 1 ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                        (pageNumber) => {
                          const isActive = pageNumber === safePage;
                          return (
                            <button
                              key={pageNumber}
                              type="button"
                              onClick={() => setPage(pageNumber)}
                              className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm font-bold ${
                                isActive
                                  ? "bg-gray-500 text-white"
                                  : "border border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                              }`}
                              aria-current={isActive ? "page" : undefined}
                            >
                              {pageNumber}
                            </button>
                          );
                        },
                      )}
                    </div>
                  ) : null}
                </ShopListFooter>
              </>
            )}
          </>
        ) : null}
      </div>
    </ShopPageShell>
  );
}
