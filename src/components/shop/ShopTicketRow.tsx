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
};

export default function ShopTicketRow({ ticket, onClick }: ShopTicketRowProps) {
  const isResolved = ticket.status === "resolved";
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
