import { Fragment, type ReactNode } from "react";
import { FiPrinter } from "react-icons/fi";
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
      <td colSpan={colSpan} className="border border-gray-300 px-3 py-2 text-right font-bold">
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
        <p className="px-4 py-6 text-center text-sm text-gray-600">
          No records found for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ad-purple text-white">
                {headers.map((header) => (
                  <th
                    key={header}
                    className={`border border-ad-purple-dark px-3 py-2 font-medium ${
                      header === "Amount" ? "text-right" : "text-left"
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
                  <tr className="bg-gray-300">
                    <td colSpan={headers.length} className="border border-gray-300 px-3 py-2 font-bold uppercase">
                      {group.label}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.id}>
                      {headers.map((header) => (
                        <td
                          key={`${row.id}-${header}`}
                          className={`border border-gray-300 px-3 py-2 ${
                            header === "Amount" ? "text-right" : ""
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
              <tr className="bg-gray-100">
                <td colSpan={headers.length - 1} className="border border-gray-300 px-3 py-2 text-right font-bold">
                  Grand Total
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right font-bold">
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
        <p className="px-4 py-6 text-center text-sm text-gray-600">
          No records found for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ad-purple text-white">
                {headers.map((header) => (
                  <th
                    key={header}
                    className={`border border-ad-purple-dark px-3 py-2 font-medium ${
                      header === "Amount" || header === "Rating" ? "text-right" : "text-left"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  {headers.map((header) => (
                    <td
                      key={`${row.id}-${header}`}
                      className={`border border-gray-300 px-3 py-2 ${
                        header === "Amount" || header === "Rating" ? "text-right" : ""
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
    <div id="report-print-area" className="rounded border border-gray-300 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3 print:hidden">
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded border border-gray-400 bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-300"
        >
          <FiPrinter size={14} aria-hidden />
          Print Report
        </button>
      </div>

      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {ownerName ? <p className="mt-1 text-sm font-semibold text-gray-800">{ownerName}</p> : null}
        <p className="mt-1 text-sm text-gray-700">
          Between {formatLongDate(fromDate)} and {formatLongDate(toDate)}
        </p>
      </div>

      {children}
    </div>
  );
}
