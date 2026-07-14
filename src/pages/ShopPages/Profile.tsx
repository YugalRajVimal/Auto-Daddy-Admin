import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import DashboardPanelCard from "../../components/COMP";
import { ThoughtOfTheDayCard } from "../../components/portal/ThoughtOfTheDayCard";
import ShopBusinessOpenToggle from "../../components/shop/ShopBusinessOpenToggle";
import ShopManageNumberingDialog, {
  type NumberingKind,
  type NumberingValues,
} from "../../components/shop/ShopManageNumberingDialog";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopBusinessProfileEditor,
  ShopCarBrandAddEditor,
  ShopCarBrandList,
  ShopOpenHoursEditor,
  ShopOperationalServicesEditor,
  ShopPersonalProfileEditor,
  type ShopCarCompany,
  type ShopServiceFormMeta,
} from "../../components/shop/forms/ShopProfileEditors";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import { ShopLoadingPanel } from "../../components/shop/ShopPanels";
import ShopDocumentTemplatePanel, {
  DUMMY_INVOICE_TEMPLATES,
  resolveTemplateSlug,
} from "../../components/shop/ShopDocumentTemplatePanel";
import { ShopSidebarButton } from "../../components/shop/ShopSidebar";
import { shopSidebarButtonStackClass } from "../../components/shop/shopSidebarStyles";
import { shopHeroOnImageMutedTextClass } from "../../components/shop/shopLayoutStyles";
import { useAuth } from "../../auth";
import {
  addMyCarCompanies,
  apiMessage,
  fetchMainCarCompanies,
  fetchServiceCatalog,
  removeMyCarCompanies,
  updateServiceWeWorkWith,
} from "../../lib/shopOwnerMutations";
import { fetchMyServices } from "../../lib/shopOwnerApi";
import { parseMyServices } from "../../lib/shopOwnerParsers";
import {
  addMyService,
  fetchAdminServices,
  fetchInvoicePrefix,
  parseInvoicePrefix,
  updateInvoicePrefix,
  updateTemplateSlugs,
} from "../../lib/autoshopownerApi";
import { getCarBrandId, getCarBrandName } from "../../lib/dummyCarBrands";
import {
  getServiceId,
  parseServiceCatalog,
  resolveProfileSelectedServices,
} from "../../lib/dummyServices";
import { normalizeShopType, normalizeShopTypes } from "../../lib/shopTypes";
import type { ShopServiceCategory } from "../../types/shopOwner";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

const NUMBERING_STORAGE_KEY = "autodaddy.shop.numbering";

const DEFAULT_NUMBERING: Record<NumberingKind, NumberingValues> = {
  estimate: { code: "", number: "1" },
  invoice: { code: "", number: "1" },
};

function readStoredNumbering(): Record<NumberingKind, NumberingValues> {
  const fallback = {
    estimate: { ...DEFAULT_NUMBERING.estimate },
    invoice: { ...DEFAULT_NUMBERING.invoice },
  };
  try {
    const raw = localStorage.getItem(NUMBERING_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Record<NumberingKind, NumberingValues>>;
    return {
      estimate: {
        code: parsed.estimate?.code ?? DEFAULT_NUMBERING.estimate.code,
        number: parsed.estimate?.number ?? DEFAULT_NUMBERING.estimate.number,
      },
      invoice: {
        code: parsed.invoice?.code ?? DEFAULT_NUMBERING.invoice.code,
        number: parsed.invoice?.number ?? DEFAULT_NUMBERING.invoice.number,
      },
    };
  } catch {
    return fallback;
  }
}

const PROFILE_SECTIONS = [
  { id: "personal", label: "Personal Profile", variant: "primary" as const },
  { id: "business", label: "Business Profile", variant: "primary" as const },
  { id: "open", label: "Shop is Open", variant: "primary" as const },
  { id: "brands", label: "Car Brand Specialist", variant: "primary" as const },
  { id: "services", label: "Operational Services", variant: "primary" as const },
  { id: "invoice-templates", label: "Invoice Templates", variant: "primary" as const },
];

const SECTION_TITLES: Record<string, string> = {
  personal: "Personal Profile",
  business: "Business Profile",
  open: "Shop is Open",
  brands: "Car Brand Specialist",
  services: "Operational Services",
  "invoice-templates": "Invoice Templates",
  team: "Team Members",
};

const FLUSH_HERO_SECTIONS = new Set([
  "open",
  "brands",
  "services",
  "invoice-templates",
]);
const TRANSPARENT_HERO_SECTIONS = new Set(["personal", "business"]);
const TOP_ALIGNED_SECTIONS = new Set([...FLUSH_HERO_SECTIONS, ...TRANSPARENT_HERO_SECTIONS]);

function ProfileHeroFormSection({
  children,
  thoughtOfTheDay,
}: {
  children: ReactNode;
  thoughtOfTheDay?: { title?: string; description?: string } | string;
}) {
  const title =
    typeof thoughtOfTheDay === "string" ? "" : thoughtOfTheDay?.title?.trim() || "";
  const description =
    typeof thoughtOfTheDay === "string"
      ? thoughtOfTheDay.trim()
      : thoughtOfTheDay?.description?.trim() || "";

  return (
    <div className="w-full min-w-0">
      {children}
      {title || description ? (
        <ThoughtOfTheDayCard title={title} description={description} placement="inline" />
      ) : null}
    </div>
  );
}

function parseCompanies(payload: unknown): ShopCarCompany[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;
  const arr = Array.isArray(data) ? data : Array.isArray(root.companies) ? root.companies : [];
  return (arr as ShopCarCompany[]).filter((c) => Boolean(getCarBrandId(c) && getCarBrandName(c) !== "—"));
}

/** Selected specialist brands live on the business profile (`carCompanies` / legacy `myCarCompanies`). */
function extractBusinessCarCompanyIds(business: unknown): string[] {
  if (!business || typeof business !== "object") return [];
  const raw =
    (business as Record<string, unknown>).carCompanies ??
    (business as Record<string, unknown>).myCarCompanies;
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      ids.push(item.trim());
      continue;
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const id =
        typeof obj._id === "string"
          ? obj._id
          : typeof obj.id === "string"
            ? obj.id
            : "";
      if (id.trim()) ids.push(id.trim());
    }
  }
  return Array.from(new Set(ids));
}

function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={shopAddNewButtonClass}>
      + Add New
    </button>
  );
}

function AddNewLink({ to }: { to: string }) {
  return (
    <Link to={to} className={shopAddNewButtonClass}>
      + Add New
    </Link>
  );
}

export default function ShopProfilePage() {
  const { token } = useAuth();
  const {
    user,
    business,
    teamMembers,
    faqsHeading,
    faqsDescription,
    thoughtOfTheDay,
    loading,
    refresh,
    isBusinessActive,
    updatingActive,
    setBusinessActive,
  } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState("personal");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [carCompanies, setCarCompanies] = useState<ShopCarCompany[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [savingBrand, setSavingBrand] = useState<string | null>(null);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [fullServiceCatalog, setFullServiceCatalog] = useState<ShopServiceCategory[]>([]);
  const [myServices, setMyServices] = useState<ShopServiceCategory[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [servicesCatalogLoading, setServicesCatalogLoading] = useState(false);
  const [myServicesLoading, setMyServicesLoading] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceMetaById, setServiceMetaById] = useState<
    Record<string, { createdAt?: string; isActive?: boolean }>
  >({});
  const [showAddHours, setShowAddHours] = useState(false);
  const [invoiceTemplateId, setInvoiceTemplateId] = useState(
    () => DUMMY_INVOICE_TEMPLATES[0]?.id ?? "",
  );
  const [savedInvoiceTemplateId, setSavedInvoiceTemplateId] = useState(
    () => DUMMY_INVOICE_TEMPLATES[0]?.id ?? "",
  );
  const [numbering, setNumbering] = useState(readStoredNumbering);
  const [manageInvoicesOpen, setManageInvoicesOpen] = useState(false);
  const [invoicePrefixLoading, setInvoicePrefixLoading] = useState(false);

  useEffect(() => {
    const invoiceSlug = resolveTemplateSlug(
      DUMMY_INVOICE_TEMPLATES,
      business?.invoiceTemplateSlug,
    );
    setInvoiceTemplateId(invoiceSlug);
    setSavedInvoiceTemplateId(invoiceSlug);
  }, [business?.invoiceTemplateSlug]);

  useEffect(() => {
    if (!manageInvoicesOpen || !token) return;
    let cancelled = false;
    setInvoicePrefixLoading(true);
    void fetchInvoicePrefix(token)
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          toast.error(apiMessage(res.data) || "Could not load invoice prefix.");
          return;
        }
        const { prefix } = parseInvoicePrefix(res.data);
        setNumbering((prev) => {
          const next = { ...prev, invoice: { ...prev.invoice, code: prefix } };
          try {
            localStorage.setItem(NUMBERING_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore quota / private mode
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load invoice prefix.");
      })
      .finally(() => {
        if (!cancelled) setInvoicePrefixLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [manageInvoicesOpen, token]);

  const shopTypes = useMemo(
    () =>
      normalizeShopTypes(
        business?.shopTypes ?? user?.shopType ?? business?.shopType
      ),
    [business?.shopType, business?.shopTypes, user?.shopType]
  );
  const shopType = shopTypes[0] ?? normalizeShopType(user?.shopType ?? business?.shopType);

  const refreshMyServices = async () => {
    if (!token) return;
    const res = await fetchMyServices(token);
    const list = res.ok ? parseMyServices(res.data) : [];
    setMyServices(list);
    setSelectedServiceIds(
      list.length > 0 ? new Set(list.map((service) => getServiceId(service))) : new Set()
    );
  };

  useEffect(() => {
    if (activeId !== "brands") return;

    setBrandsLoading(true);
    if (!token) {
      setCarCompanies([]);
      setSelectedBrands(new Set());
      setBrandsLoading(false);
      return;
    }

    let cancelled = false;
    void fetchMainCarCompanies(token).then((res) => {
      if (cancelled) return;
      const apiList = res.ok ? parseCompanies(res.data) : [];
      const catalog = [...apiList].sort((a, b) =>
        getCarBrandName(a).localeCompare(getCarBrandName(b), undefined, { sensitivity: "base" })
      );
      setCarCompanies(catalog);
      setBrandsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeId, token]);

  useEffect(() => {
    if (activeId !== "brands") return;
    setSelectedBrands(new Set(extractBusinessCarCompanyIds(business)));
  }, [activeId, business]);

  useEffect(() => {
    if (activeId !== "services") return;

    const applyCatalog = (apiList: ShopServiceCategory[]) => {
      setFullServiceCatalog(apiList);
      setServicesCatalogLoading(false);
    };

    setServicesCatalogLoading(true);
    if (!token) {
      applyCatalog([]);
      return;
    }

    void (async () => {
      try {
        // Prefer the new admin services catalog endpoint (supports shopType + name search).
        // Fetch for each shop type the owner selected so the vendor-type dropdown can filter.
        const typesToFetch = shopTypes.length > 0 ? shopTypes : [shopType];
        const results = await Promise.all(
          typesToFetch.map((type) =>
            fetchAdminServices(token, { shopType: type || undefined, services: undefined })
          )
        );
        const byId = new Map<string, ShopServiceCategory>();
        for (const res of results) {
          if (!res.ok) continue;
          for (const service of parseServiceCatalog(res.data)) {
            const id = getServiceId(service);
            if (id && !byId.has(id)) byId.set(id, service);
          }
        }
        const apiList = [...byId.values()];
        if (apiList.length > 0) {
          applyCatalog(apiList);
          return;
        }
      } catch {
        // fall through to legacy
      }

      // Legacy fallback (older route shape).
      try {
        const legacyRes = await fetchServiceCatalog(token);
        const legacyList = legacyRes.ok ? parseServiceCatalog(legacyRes.data) : [];
        applyCatalog(legacyList);
      } catch {
        applyCatalog([]);
      }
    })();
  }, [activeId, token, shopType, shopTypes]);

  useEffect(() => {
    if (activeId !== "services") {
      setShowAddService(false);
      setEditingServiceId(null);
      setMyServicesLoading(false);
      return;
    }
    if (servicesCatalogLoading) return;

    const applyMyServices = (list: ShopServiceCategory[]) => {
      setMyServices(list);
      setSelectedServiceIds(
        list.length > 0 ? new Set(list.map((service) => getServiceId(service))) : new Set()
      );
      setMyServicesLoading(false);
    };

    if (!token) {
      applyMyServices([]);
      return;
    }

    setMyServicesLoading(true);
    let cancelled = false;
    void fetchMyServices(token)
      .then((res) => {
        if (cancelled) return;
        applyMyServices(res.ok ? parseMyServices(res.data) : []);
      })
      .catch(() => {
        if (cancelled) return;
        applyMyServices([]);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId, servicesCatalogLoading, token]);

  const selectedBrandList = useMemo(
    () => carCompanies.filter((company) => selectedBrands.has(getCarBrandId(company))),
    [carCompanies, selectedBrands]
  );
  const selectedServiceList = useMemo(
    () => resolveProfileSelectedServices(fullServiceCatalog, myServices, selectedServiceIds),
    [fullServiceCatalog, myServices, selectedServiceIds]
  );
  const selectedServiceListWithMeta = useMemo(
    () =>
      selectedServiceList.map((service) => {
        const id = getServiceId(service);
        const meta = serviceMetaById[id];
        return {
          ...service,
          createdAt: meta?.createdAt ?? service.createdAt,
          isActive: meta?.isActive ?? service.isActive ?? true,
        };
      }),
    [selectedServiceList, serviceMetaById]
  );

  const applyServiceMeta = (id: string, meta?: ShopServiceFormMeta) => {
    if (!meta) return;
    setServiceMetaById((prev) => ({
      ...prev,
      [id]: { createdAt: meta.createdAt, isActive: meta.isActive },
    }));
  };

  useEffect(() => {
    setShowAddHours(false);
    setShowAddBrand(false);
    setShowAddService(false);
    setEditingServiceId(null);
  }, [activeId]);

  const headerAction = useMemo(() => {
    switch (activeId) {
      case "team":
        return <AddNewLink to="/shop/team/new" />;
      default:
        return undefined;
    }
  }, [activeId]);

  const sidebarFooter = useMemo(
    () => (
      <div className={`mt-4 ${shopSidebarButtonStackClass}`}>
        <ShopSidebarButton label="Manage Invoices" onClick={() => setManageInvoicesOpen(true)} />
      </div>
    ),
    [],
  );

  const saveInvoiceNumbering = async (values: NumberingValues): Promise<boolean> => {
    if (!token) {
      toast.error("Sign in to update invoice prefix.");
      return false;
    }
    const prefix = values.code.trim();
    const res = await updateInvoicePrefix(token, prefix);
    if (!res.ok) {
      toast.error(apiMessage(res.data) || "Could not update invoice prefix.");
      return false;
    }
    setNumbering((prev) => {
      const next = {
        ...prev,
        invoice: {
          code: prefix,
          number: values.number.trim() || prev.invoice.number,
        },
      };
      try {
        localStorage.setItem(NUMBERING_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota / private mode
      }
      return next;
    });
    return true;
  };

  const removeBrand = async (company: ShopCarCompany) => {
    const id = getCarBrandId(company);
    const name = getCarBrandName(company);
    if (!window.confirm(`Remove ${name} from your car brands?`)) return;
    await toggleBrand(id, false);
  };

  const toggleBrand = async (id: string, next: boolean) => {
    if (!token || !id.trim()) return;
    setSavingBrand(id);
    try {
      const res = next ? await addMyCarCompanies(token, [id]) : await removeMyCarCompanies(token, [id]);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not update.");
        return;
      }
      setSelectedBrands((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(id);
        else copy.delete(id);
        return copy;
      });
      void refresh();
    } finally {
      setSavingBrand(null);
    }
  };

  const removeSelectedServices = async (idsToRemove: Set<string>): Promise<boolean> => {
    const nextIds = [...selectedServiceIds].filter((id) => !idsToRemove.has(id));

    const applyRemoval = () => {
      if (editingServiceId && idsToRemove.has(editingServiceId)) {
        setEditingServiceId(null);
        setShowAddService(false);
      }
      setServiceMetaById((prev) => {
        const next = { ...prev };
        for (const id of idsToRemove) delete next[id];
        return next;
      });
      setSelectedServiceIds(new Set(nextIds));
      toast.success("Selected services removed.");
    };

    if (!token) return false;
    const res = await updateServiceWeWorkWith(token, nextIds);
    if (!res.ok) {
      toast.error(apiMessage(res.data) || "Could not remove services.");
      return false;
    }

    applyRemoval();
    void refreshMyServices();
    return true;
  };

  const renderContent = () => {
    if (loading) return <ShopLoadingPanel className="flex-1" variant="form" />;

    switch (activeId) {
      case "personal":
        return (
          <ProfileHeroFormSection thoughtOfTheDay={thoughtOfTheDay}>
            <ShopPersonalProfileEditor
              user={user}
              city={user?.city ?? business?.city}
              onSaved={() => void refresh()}
            />
          </ProfileHeroFormSection>
        );
      case "business":
        return (
          <ProfileHeroFormSection thoughtOfTheDay={thoughtOfTheDay}>
            <ShopBusinessProfileEditor
              business={business}
              zipCode={user?.pincode}
              shopType={user?.shopType ?? business?.shopType}
              shopTypes={business?.shopTypes}
              onSaved={() => void refresh()}
            />
          </ProfileHeroFormSection>
        );
      case "open":
        return (
          <ShopOpenHoursEditor
            perDayOpenHours={business?.perDayOpenHours}
            onSaved={() => void refresh()}
            showAddForm={showAddHours}
            onAddFormClose={() => setShowAddHours(false)}
            headerAction={
              !showAddHours ? (
                <div className="flex items-center gap-2">
                  <ShopBusinessOpenToggle
                    isBusinessActive={isBusinessActive}
                    updating={updatingActive}
                    onChange={setBusinessActive}
                  />
                  <AddNewButton onClick={() => setShowAddHours(true)} />
                </div>
              ) : undefined
            }
          />
        );
      case "brands":
        return (
          <div className="space-y-1">
            {!showAddBrand ? (
              <div className="flex min-h-[2rem] items-center justify-end gap-2">
                <AddNewButton onClick={() => setShowAddBrand(true)} />
              </div>
            ) : null}
            <ShopReveal show={showAddBrand && !brandsLoading}>
              <ShopCarBrandAddEditor
                companies={carCompanies}
                selectedIds={selectedBrands}
                onSaved={(id) => {
                  setSelectedBrands((prev) => new Set([...prev, id]));
                  void refresh();
                  setShowAddBrand(false);
                }}
                onClose={() => setShowAddBrand(false)}
              />
            </ShopReveal>
            {brandsLoading ? (
              <ShopLoadingPanel variant="brand-grid" />
            ) : selectedBrandList.length === 0 ? (
              <p className="text-center text-sm text-gray-600">
                No car brands added yet. Click &ldquo;+ Add New&rdquo; to add one.
              </p>
            ) : (
              <ShopCarBrandList
                brands={selectedBrandList}
                savingBrandId={savingBrand}
                onRemove={(company) => void removeBrand(company)}
              />
            )}
          </div>
        );
      case "services":
        if (servicesCatalogLoading) {
          return <ShopLoadingPanel variant="operational-services" />;
        }
        return (
          <ShopOperationalServicesEditor
            loading={myServicesLoading}
            services={selectedServiceListWithMeta}
            fullServiceCatalog={fullServiceCatalog}
            selectedIds={selectedServiceIds}
            shopType={shopType}
            shopTypes={shopTypes}
            editingId={editingServiceId}
            showAddForm={showAddService}
            onAddFormClose={() => setShowAddService(false)}
            onSaveService={async (id, replacesId, meta) => {
              const persistMeta = () => applyServiceMeta(id, meta);

              if (!token) return false;

              persistMeta();

              const isMetaOnly =
                (replacesId === undefined && editingServiceId === id) ||
                (replacesId !== undefined && replacesId === id);

              if (isMetaOnly) return true;

              const createdAt = meta?.createdAt?.trim() || new Date().toISOString().slice(0, 10);
              const dateIso = new Date(createdAt).toISOString();
              const status = meta?.isActive === false ? "Inactive" : "Active";

              const addRes = await addMyService(token, { serviceId: id, status, date: dateIso });
              if (!addRes.ok) {
                toast.error(apiMessage(addRes.data) || "Could not add service.");
                return true; // handled (prevents legacy fallback), but shows error
              }

              setSelectedServiceIds((prev) => {
                const next = new Set(prev);
                if (replacesId) next.delete(replacesId);
                next.add(id);
                return next;
              });
              toast.success(apiMessage(addRes.data) || "Service added.");
              return true;
            }}
            onSaved={() => {
              void refreshMyServices();
              setShowAddService(false);
              setEditingServiceId(null);
            }}
            onCloseForm={() => {
              setShowAddService(false);
              setEditingServiceId(null);
            }}
            onEdit={(category) => {
              setShowAddService(false);
              setEditingServiceId(getServiceId(category));
            }}
            onRemoveSelected={removeSelectedServices}
            headerAction={
              !showAddService && editingServiceId === null ? (
                <AddNewButton onClick={() => setShowAddService(true)} />
              ) : undefined
            }
          />
        );
      case "invoice-templates":
        return (
          <ShopDocumentTemplatePanel
            templates={DUMMY_INVOICE_TEMPLATES}
            selectedId={invoiceTemplateId}
            onSelect={setInvoiceTemplateId}
            savedId={savedInvoiceTemplateId}
            shopPreview={{
              name: business?.businessName,
              address:
                [business?.businessAddress ?? business?.address, business?.city, business?.pincode]
                  .filter(Boolean)
                  .join(", ") || undefined,
              phone: business?.businessPhone,
              email: business?.email,
              logoUrl: business?.businessLogo,
            }}
            onSave={async (id) => {
              if (!token) {
                toast.error("Sign in to save template.");
                return false;
              }
              const res = await updateTemplateSlugs(token, { invoiceTemplateSlug: id });
              if (!res.ok) {
                toast.error(apiMessage(res.data) || "Could not save invoice template.");
                return false;
              }
              setSavedInvoiceTemplateId(id);
              void refresh();
              return true;
            }}
          />
        );
      case "team":
        return (
          <>
            {teamMembers.length === 0 ? (
              <p className={`text-center text-sm ${shopHeroOnImageMutedTextClass}`}>No team members yet.</p>
            ) : (
              <ul className="space-y-3">
                {teamMembers.map((member) => (
                  <li key={member._id ?? member.id ?? member.name}>
                    <DashboardPanelCard className="mb-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.designation}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#006600]">
                          {member.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </div>
                    </DashboardPanelCard>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-center">
              <Link to="/shop/team" className="text-sm font-semibold text-white underline hover:text-white/80">
                Manage team →
              </Link>
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ShopPageShell
        pageHeading={SECTION_TITLES[activeId] ?? "Profile"}
        metaTitle="Profile | AutoDaddy"
        metaDescription="Auto shop owner profile"
        sidebarVariant="nav"
        sidebarItems={PROFILE_SECTIONS}
        activeSidebarId={activeId}
        onSidebarSelect={setActiveId}
        sidebarFooter={sidebarFooter}
        headerAction={headerAction}
        heroBackgroundImage={false}
        contentTopOffset={TOP_ALIGNED_SECTIONS.has(activeId)}
        heroCardFlush={TOP_ALIGNED_SECTIONS.has(activeId)}
        contentFillHeight={activeId === "invoice-templates"}
        onFaqsOpen={() => setFaqsOpen(true)}
        onFaqsClose={() => setFaqsOpen(false)}
        faqsOpen={faqsOpen}
        faqsHeading={faqsHeading}
        faqsDescription={faqsDescription}
      >
        {renderContent()}
      </ShopPageShell>

      <ShopManageNumberingDialog
        open={manageInvoicesOpen}
        kind="invoice"
        initial={numbering.invoice}
        loading={invoicePrefixLoading}
        onClose={() => setManageInvoicesOpen(false)}
        onSave={saveInvoiceNumbering}
      />
    </>
  );
}
