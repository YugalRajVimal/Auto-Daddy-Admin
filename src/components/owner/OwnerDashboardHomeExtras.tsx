import type { CarOwnerContentBlock, CarOwnerNextService } from "../../hooks/useOwnerPortal";

function vehicleLabel(next: CarOwnerNextService): string {
  const v = next.vehicle;
  if (!v) return "Vehicle";
  const parts = [v.year, v.make?.name, v.make?.model].filter(Boolean);
  return parts.length ? parts.join(" ") : v.licensePlateNo?.trim() || "Vehicle";
}

function formatKm(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString()} km`;
}

type OwnerDashboardHomeExtrasProps = {
  sections: CarOwnerContentBlock[];
  nextService: CarOwnerNextService | null;
};

export default function OwnerDashboardHomeExtras({
  sections,
  nextService,
}: OwnerDashboardHomeExtrasProps) {
  if (!nextService && sections.length === 0) return null;

  return (
    <div className="flex shrink-0 flex-col gap-3 px-1 pb-1">
      {nextService ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ad-purple">
                Next service
              </p>
              <h3 className="mt-1 truncate text-base font-bold text-gray-900">
                {vehicleLabel(nextService)}
              </h3>
              {nextService.vehicle?.licensePlateNo?.trim() ? (
                <p className="mt-0.5 text-sm font-semibold text-gray-600">
                  {nextService.vehicle.licensePlateNo.trim()}
                </p>
              ) : null}
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Due at</p>
              <p className="text-sm font-bold text-gray-900">
                {formatKm(nextService.dueOdometerReading)}
              </p>
            </div>
          </div>

          {nextService.issueDescription?.trim() ? (
            <p className="mt-3 text-sm text-gray-600">{nextService.issueDescription.trim()}</p>
          ) : null}

          {Array.isArray(nextService.services) && nextService.services.length > 0 ? (
            <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              {nextService.services.map((svc, idx) => (
                <li key={`${svc.service}-${idx}`}>
                  <p className="text-sm font-bold text-gray-900">{svc.service}</p>
                  {svc.subServices?.map((sub, subIdx) => (
                    <p key={`${sub.name}-${subIdx}`} className="text-xs text-gray-500">
                      {sub.name}
                      {sub.desc?.trim() ? ` — ${sub.desc.trim()}` : ""}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
            {nextService.serviceType?.trim() ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1">{nextService.serviceType}</span>
            ) : null}
            {nextService.priorityLevel?.trim() ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1">{nextService.priorityLevel}</span>
            ) : null}
            {nextService.status?.trim() ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1">{nextService.status}</span>
            ) : null}
          </div>
        </section>
      ) : null}

      {sections.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <article
              key={section._id ?? `${section.heading}-${section.desc}`}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              {section.heading ? (
                <h3 className="text-sm font-bold text-gray-900">{section.heading}</h3>
              ) : null}
              {section.desc ? (
                <p className={`text-sm leading-relaxed text-gray-600 ${section.heading ? "mt-1.5" : ""}`}>
                  {section.desc}
                </p>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
