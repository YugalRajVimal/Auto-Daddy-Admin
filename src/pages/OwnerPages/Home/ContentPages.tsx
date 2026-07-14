import { useMemo, useState, type ReactNode } from "react";
import { FiChevronDown, FiHelpCircle, FiLock, FiStar } from "react-icons/fi";
import OwnerPageShell, { ownerPageIntroClass } from "../../../components/owner/OwnerPageShell";
import {
  useCarOwnerFaqs,
  useCarOwnerPrivacy,
  useCarOwnerProductFeatures,
  type CarOwnerContentBlock,
} from "../../../hooks/useOwnerPortal";
import { Skeleton } from "../../../components/common/Skeleton";
import {
  DUMMY_OWNER_FAQS,
  withDummyFeatures,
  withDummyPrivacy,
  type DummyFaqItem,
} from "../../../lib/dummyOwnerHomeProfile";

const FEATURE_ACCENTS = [
  { soft: "bg-sky-50", tint: "text-sky-700", ring: "ring-sky-100", blob: "bg-sky-100" },
  { soft: "bg-emerald-50", tint: "text-emerald-700", ring: "ring-emerald-100", blob: "bg-emerald-100" },
  { soft: "bg-amber-50", tint: "text-amber-700", ring: "ring-amber-100", blob: "bg-amber-100" },
  { soft: "bg-rose-50", tint: "text-rose-700", ring: "ring-rose-100", blob: "bg-rose-100" },
  { soft: "bg-indigo-50", tint: "text-indigo-700", ring: "ring-indigo-100", blob: "bg-indigo-100" },
  { soft: "bg-teal-50", tint: "text-teal-700", ring: "ring-teal-100", blob: "bg-teal-100" },
] as const;

type FaqItem = DummyFaqItem;

function DemoBadge() {
  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-100">
      Demo content
    </span>
  );
}

function PageIntro({
  eyebrow,
  title,
  subtitle,
  icon,
  accentClass,
  demo,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  accentClass: string;
  demo?: boolean;
}) {
  return (
    <div className={`${ownerPageIntroClass} flex flex-wrap items-start justify-between gap-3`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-slate-500">{eyebrow}</p>
          {demo ? <DemoBadge /> : null}
        </div>
        <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>
      </div>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${accentClass}`}>
        {icon}
      </span>
    </div>
  );
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div
            key={`${item.question}-${index}`}
            className={`overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 transition ${
              open ? "ring-sky-200" : "ring-black/5 hover:ring-sky-100"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : index)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <FiHelpCircle size={16} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-slate-900 md:text-base">
                {item.question}
              </span>
              <FiChevronDown
                className={`shrink-0 text-slate-400 transition ${open ? "rotate-180 text-sky-600" : ""}`}
                size={18}
              />
            </button>
            {open ? (
              <div className="border-t border-slate-100 px-4 py-3 pl-[3.75rem] text-sm leading-relaxed text-slate-600">
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function FeatureCards({ sections }: { sections: CarOwnerContentBlock[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {sections.map((section, index) => {
        const accent = FEATURE_ACCENTS[index % FEATURE_ACCENTS.length];
        return (
          <article
            key={section._id ?? `${section.heading}-${index}`}
            className={`group relative overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ${accent.ring} transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.1)]`}
          >
            <div
              className={`pointer-events-none absolute -right-6 -top-6 size-24 rounded-full ${accent.blob} opacity-70 transition group-hover:scale-110`}
            />
            <div className="relative flex items-start gap-3">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent.soft} ${accent.tint}`}
              >
                <FiStar size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  {section.heading?.trim() || `Feature ${index + 1}`}
                </h3>
                {section.desc?.trim() ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{section.desc.trim()}</p>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PrivacyDocument({ heading, description }: { heading: string; description: string }) {
  const sections = useMemo(() => {
    const blocks = description
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .filter(Boolean);
    if (blocks.length <= 1) {
      return [{ title: heading, body: description.trim() }];
    }
    return blocks.map((block, index) => {
      const lines = block.split(/\n+/).map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2 && lines[0].length < 80) {
        return { title: lines[0], body: lines.slice(1).join("\n") };
      }
      return { title: `Section ${index + 1}`, body: block };
    });
  }, [description, heading]);

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <article
          key={`${section.title}-${index}`}
          className="rounded-2xl border border-white/80 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-emerald-100"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FiLock size={14} />
            </span>
            <h3 className="text-sm font-bold text-slate-900 md:text-base">{section.title}</h3>
          </div>
          <div className="space-y-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {section.body}
          </div>
        </article>
      ))}
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

export function OwnerFaqsPage() {
  const { loading, faqsHeading, items: liveItems } = useCarOwnerFaqs("carowner");
  const usingDummy = !loading && liveItems.length === 0;
  const items = usingDummy ? DUMMY_OWNER_FAQS : liveItems;

  return (
    <OwnerPageShell pageHeading="" metaTitle="FAQs | AutoDaddy" metaDescription="FAQs for car owners" noPanel>
      <div className="space-y-4">
        <PageIntro
          eyebrow="Help center"
          title={faqsHeading || "FAQs"}
          subtitle="Quick answers about your garage, shops, and paperwork."
          icon={<FiHelpCircle size={20} className="text-sky-700" />}
          accentClass="bg-sky-50 text-sky-700"
          demo={usingDummy}
        />
        {loading ? <LoadingBlock /> : <FaqAccordion items={items} />}
      </div>
    </OwnerPageShell>
  );
}

export function OwnerPrivacyPage() {
  const { loading, privacyHeading, privacyDescription } = useCarOwnerPrivacy({
    country: "canada",
    type: "privacy",
  });
  const privacy = withDummyPrivacy(privacyHeading, privacyDescription);

  return (
    <OwnerPageShell
      pageHeading=""
      metaTitle="Privacy | AutoDaddy"
      metaDescription="Privacy policy for car owners"
      noPanel
    >
      <div className="space-y-4">
        <PageIntro
          eyebrow="Trust & safety"
          title={privacy.heading}
          subtitle="How AutoDaddy handles your personal and vehicle information."
          icon={<FiLock size={20} className="text-emerald-700" />}
          accentClass="bg-emerald-50 text-emerald-700"
          demo={!loading && privacy.usingDummy}
        />
        {loading ? (
          <LoadingBlock />
        ) : (
          <PrivacyDocument heading={privacy.heading} description={privacy.description} />
        )}
      </div>
    </OwnerPageShell>
  );
}

export function OwnerFeaturesPage() {
  const { loading, sections } = useCarOwnerProductFeatures({
    country: "canada",
    role: "carowner",
  });
  const features = withDummyFeatures(sections);

  return (
    <OwnerPageShell
      pageHeading=""
      metaTitle="Features | AutoDaddy"
      metaDescription="Product features for car owners"
      noPanel
    >
      <div className="space-y-4">
        <PageIntro
          eyebrow="Product"
          title="Features"
          subtitle="Everything built into your car-owner workspace."
          icon={<FiStar size={20} className="text-amber-700" />}
          accentClass="bg-amber-50 text-amber-700"
          demo={!loading && features.usingDummy}
        />
        {loading ? <LoadingBlock /> : <FeatureCards sections={features.sections} />}
      </div>
    </OwnerPageShell>
  );
}

export default OwnerFaqsPage;
