import { Fragment, type ReactNode } from "react";
import { FiPrinter } from "react-icons/fi";
import {
  ADMIN_PANEL_TABLE_CLASS,
  ADMIN_PANEL_TD_CLASS,
  ADMIN_PANEL_TH_CLASS,
} from "../admin/adminPanelTableStyles";
import {
  cellValueForHeader,
  formatLongDate,
  formatReportAmount,
  sumOwnerAmounts,
  tableHeadersForGroupBy,
  type GroupBy,
  type OwnerReportGroup,
  type OwnerReportRow,
} from "../../lib/ownerReportGrouping";

function GroupTotalRow({ colSpan, total }: { colSpan: number; total: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="border border-slate-200 px-3 py-2 text-right text-sm font-bold text-slate-800">
        Total : {formatReportAmount(total)}
      </td>
    </tr>
  );
}

type OwnerGroupedReportTableProps = {
  title: string;
  ownerName?: string;
  fromDate: string;
  toDate: string;
  groupBy: GroupBy;
  rows: OwnerReportRow[];
  vendorColumnLabel?: string;
};

export function OwnerGroupedReportTable({
  title,
  ownerName,
  fromDate,
  toDate,
  groupBy,
  rows,
  vendorColumnLabel = "Auto Shop",
}: OwnerGroupedReportTableProps) {
  const groups: OwnerReportGroup[] = (() => {
    const map = new Map<string, OwnerReportRow[]>();
    for (const row of rows) {
      const key =
        groupBy === "vendor"
          ? row.vendor.trim() || "—"
          : groupBy === "project"
            ? row.project.trim() || "—"
            : row.category.trim() || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return [...map.entries()]
      .map(([key, groupRows]) => ({
        key,
        label: groupBy === "vendor" ? key.toUpperCase() : key,
        rows: [...groupRows].sort((a, b) => a.date.localeCompare(b.date)),
        total: sumOwnerAmounts(groupRows),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  const headers = [...tableHeadersForGroupBy(groupBy, vendorColumnLabel)];
  const grandTotal = sumOwnerAmounts(rows);

  return (
    <OwnerReportShell title={title} ownerName={ownerName} fromDate={fromDate} toDate={toDate}>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-600">
          No records found for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200/80">
          <table className={ADMIN_PANEL_TABLE_CLASS}>
            <thead>
              <tr className="bg-gradient-to-r from-ad-purple to-ad-purple-dark text-white">
                {headers.map((header) => (
                  <th
                    key={header}
                    className={`${ADMIN_PANEL_TH_CLASS} ${header === "Amount" ? "text-right" : "text-left"
                      }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.key}>
                  <tr className="bg-slate-100">
                    <td colSpan={headers.length} className="border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                      {group.label}
                    </td>
                  </tr>
                  {group.rows.map((row, rowIdx) => (
                    <tr key={row.id} className={rowIdx % 2 === 0 ? "bg-white/90" : "bg-slate-50/80"}>
                      {headers.map((header) => (
                        <td
                          key={`${row.id}-${header}`}
                          className={`${ADMIN_PANEL_TD_CLASS} ${header === "Amount" ? "text-right" : ""
                            } ${header === "Auto Shop" || header === "Vendor" ? "uppercase" : ""}`}
                        >
                          {cellValueForHeader(row, header, groupBy)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <GroupTotalRow colSpan={headers.length} total={group.total} />
                </Fragment>
              ))}
              <tr className="bg-slate-50">
                <td colSpan={headers.length - 1} className="border border-slate-200 px-3 py-2.5 text-right font-bold text-slate-900">
                  Grand Total
                </td>
                <td className="border border-slate-200 px-3 py-2.5 text-right font-bold text-slate-900">
                  {formatReportAmount(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </OwnerReportShell>
  );
}

type OwnerFlatReportTableProps = {
  title: string;
  ownerName?: string;
  fromDate: string;
  toDate: string;
  headers: string[];
  rows: OwnerReportRow[];
  renderCell: (row: OwnerReportRow, header: string) => string;
};

export function OwnerFlatReportTable({
  title,
  ownerName,
  fromDate,
  toDate,
  headers,
  rows,
  renderCell,
}: OwnerFlatReportTableProps) {
  return (
    <OwnerReportShell title={title} ownerName={ownerName} fromDate={fromDate} toDate={toDate}>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-600">
          No records found for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200/80">
          <table className={ADMIN_PANEL_TABLE_CLASS}>
            <thead>
              <tr className="bg-gradient-to-r from-ad-purple to-ad-purple-dark text-white">
                {headers.map((header) => (
                  <th
                    key={header}
                    className={`${ADMIN_PANEL_TH_CLASS} ${header === "Amount" || header === "Rating" ? "text-right" : "text-left"
                      }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white/90" : "bg-slate-50/80"}>
                  {headers.map((header) => (
                    <td
                      key={`${row.id}-${header}`}
                      className={`${ADMIN_PANEL_TD_CLASS} ${header === "Amount" || header === "Rating" ? "text-right" : ""
                        }`}
                    >
                      {renderCell(row, header)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OwnerReportShell>
  );
}

function OwnerReportShell({
  title,
  ownerName,
  fromDate,
  toDate,
  children,
}: {
  title: string;
  ownerName?: string;
  fromDate: string;
  toDate: string;
  children: ReactNode;
}) {
  return (
    <div
      id="report-print-area"
      className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 sm:p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3 print:hidden">
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <FiPrinter size={14} aria-hidden />
          Print Report
        </button>
      </div>

      <div className="mb-5 text-center">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">{title}</h3>
        {ownerName ? <p className="mt-1 text-sm font-semibold text-slate-700">{ownerName}</p> : null}
        <p className="mt-1 text-sm text-slate-500">
          Between {formatLongDate(fromDate)} and {formatLongDate(toDate)}
        </p>
      </div>

      {children}
    </div>
  );
}
