export type ShopTicket = {
  id: string;
  ticketNo: string;
  date: string;
  subject: string;
  status: "active" | "resolved";
};

type ShopTicketRowProps = {
  ticket: ShopTicket;
  onClick?: () => void;
  /** Soft glass card for the car-owner portal. */
  ownerStyle?: boolean;
};

export default function ShopTicketRow({ ticket, onClick, ownerStyle = false }: ShopTicketRowProps) {
  const isResolved = ticket.status === "resolved";

  if (ownerStyle) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/80 bg-white/95 px-4 py-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.1)] hover:ring-sky-100 sm:px-5"
      >
        <div className="min-w-0 shrink-0">
          <p className="text-sm font-bold tracking-tight text-slate-900">
            Ticket # {ticket.ticketNo}
          </p>
          <p className="mt-0.5 text-xs font-medium text-sky-700">{ticket.date}</p>
        </div>
        <p className="min-w-0 flex-1 truncate text-sm text-slate-600">{ticket.subject}</p>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
            isResolved
              ? "bg-slate-100 text-slate-600 ring-slate-200"
              : "bg-emerald-50 text-emerald-700 ring-emerald-100"
          }`}
        >
          {isResolved ? "Resolved" : "Active"}
        </span>
      </button>
    );
  }

  const bg = isResolved ? "bg-[#FFE4CC]" : "bg-[#CCFFCC]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-md px-4 py-3 text-left shadow-sm transition-opacity hover:opacity-95 sm:px-6 ${bg}`}
    >
      <div className="min-w-0 shrink-0">
        <p className="text-sm font-bold text-ad-purple">Ticket # {ticket.ticketNo}</p>
        <p className="text-xs font-medium text-blue-600">{ticket.date}</p>
      </div>
      <p className="min-w-0 flex-1 truncate text-sm italic text-gray-600">{ticket.subject}</p>
      <p className="shrink-0 text-sm capitalize text-gray-600">
        {isResolved ? "Resolved" : "Active"}
      </p>
    </button>
  );
}
