import { useEffect, useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiRefreshCcw } from "react-icons/fi";
import { useAuth } from "../../auth";
import AdminPage from "../../components/admin/AdminPage";
import {
  fetchPlatformSettings,
  updatePlatformSettings,
  type PlatformSettings,
} from "../../lib/platformSettingsApi";

type FieldDef = {
  key: keyof PlatformSettings;
  label: string;
  helper?: string;
  isCurrency?: boolean;
};

type ModeId = "platform" | "wallet" | "website";

const MODES: { id: ModeId; label: string; fields: FieldDef[] }[] = [
  {
    id: "platform",
    label: "Platform",
    fields: [
      {
        key: "perJobCardCharge",
        label: "Job-Card fee ea",
        helper: "Amount charged per job card (in $).",
        isCurrency: true,
      },
      {
        key: "trialDays",
        label: "Exemption in free trial days",
        helper: "Number of days users can use the platform for free.",
      },
    ],
  },
  {
    id: "wallet",
    label: "Wallet",
    fields: [
      {
        key: "minWalletRechargeAmount",
        label: "Minimum Top-up",
        helper: "Smallest amount allowed for wallet top-ups (in $).",
        isCurrency: true,
      },
    ],
  },
  {
    id: "website",
    label: "Website",
    fields: [
      {
        key: "websiteSubscriptionPrice",
        label: "Website Subscription Price",
        helper: "Price for website add-on subscription (in $).",
        isCurrency: true,
      },
      {
        key: "websiteSubscriptionDays",
        label: "Website Subscription Days",
        helper: "Validity period for the website subscription (in days).",
      },
    ],
  },
];

const labelClass = "mb-1 block text-base text-gray-900";
const inputClass =
  "h-12 w-full rounded-md border border-gray-400 bg-white px-4 text-lg text-gray-900 placeholder:text-gray-400 focus:border-ad-purple focus:outline-none disabled:opacity-70";
const helperClass = "mt-1 text-xs text-gray-500";

const money = (value: number | undefined) => `$ ${Number(value ?? 0).toFixed(2)}`;

/** Green plan card used in the right-hand preview, mirroring the wallet "Current Plan" mockup. */
function PlanCard({
  title,
  big,
  note,
  side,
}: {
  title: string;
  big: string;
  note: string;
  side?: { label: string; value: string };
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-[#a8d244] px-6 py-5 text-white shadow-sm">
      <div>
        <p className="text-xl font-bold">{title}</p>
        <p className="mt-2 text-4xl font-extrabold">{big}</p>
        <p className="mt-2 max-w-xs text-xs italic">{note}</p>
      </div>
      {side && (
        <div className="text-right">
          <p className="text-sm font-bold underline">{side.label}</p>
          <p className="mt-2 text-4xl font-extrabold">{side.value}</p>
        </div>
      )}
    </div>
  );
}

export default function PlatformSettingsPage() {
  const { session } = useAuth();
  const token = session?.token ?? "";
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [original, setOriginal] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [modeId, setModeId] = useState<ModeId>("platform");

  useEffect(() => {
    setSettings(null);
    setOriginal(null);
    setError(null);
    setSuccess(null);
    fetchPlatformSettings(token).then((res) => {
      if (
        res &&
        res.ok &&
        res.data &&
        typeof res.data.success === "boolean" &&
        res.data.data
      ) {
        setSettings(res.data.data);
        setOriginal(res.data.data);
      } else {
        setError("Failed to load settings.");
      }
    });
  }, [token, reload]);

  const dirty =
    settings && original
      ? JSON.stringify(settings) !== JSON.stringify(original)
      : false;

  if (!settings)
    return (
      <AdminPage title="Settings" noPanel>
        <div className="flex h-[300px] items-center justify-center">
          <span className="mr-2 animate-spin text-ad-purple">
            <FiRefreshCcw size={20} />
          </span>
          <span className="text-[15px] text-gray-400">
            {error ?? "Loading platform settings…"}
          </span>
        </div>
      </AdminPage>
    );

  const handleChange = (key: keyof PlatformSettings, value: string) => {
    setSettings({ ...settings, [key]: Number(value) });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await updatePlatformSettings(token, settings);
      if (res?.data?.success) {
        setSettings(res.data.data);
        setOriginal(res.data.data);
        setSuccess("Settings saved successfully.");
      } else {
        setError("Failed to save changes.");
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Request failed! Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(original);
    setError(null);
    setSuccess(null);
  };

  const mode = MODES.find((m) => m.id === modeId) ?? MODES[0];

  const preview =
    mode.id === "platform" ? (
      <PlanCard
        title="Job Card Charge"
        big={`${money(settings.perJobCardCharge)} ea`}
        note="Charged for every job card created on the platform."
        side={{ label: "Free trial (days)", value: String(settings.trialDays ?? 0) }}
      />
    ) : mode.id === "wallet" ? (
      <div className="flex flex-wrap items-start gap-8">
        <div className="min-w-[280px] flex-1">
          <PlanCard
            title="Job Card Top-up"
            big={`${money(settings.perJobCardCharge)} ea`}
            note="( Cost charged from Car owner for unlimited storage of Job-Card )"
            side={{ label: "Minimum top-up", value: money(settings.minWalletRechargeAmount) }}
          />
        </div>
        <div className="w-full max-w-[280px] rounded-xl border border-gray-400 bg-white px-5 py-4" aria-hidden>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-lg font-bold text-gray-700">Add Funds</span>
            <span className="text-xs text-blue-700 underline">minimum top up {money(settings.minWalletRechargeAmount)}</span>
          </div>
          <div className="mt-3 rounded border border-gray-300 px-3 py-2 text-sm text-gray-400">Enter Amt here</div>
          <div className="mt-4 flex justify-end">
            <span className="bg-[#a8d244] px-6 py-1 text-sm font-bold text-white">Continue</span>
          </div>
        </div>
        <span className="pointer-events-none absolute bottom-24 left-1/3 -rotate-[30deg] select-none text-8xl font-extrabold tracking-widest text-gray-300/70">
          SAMPLE
        </span>
      </div>
    ) : (
      <PlanCard
        title="Website Subscription"
        big={money(settings.websiteSubscriptionPrice)}
        note="Price of the website add-on subscription."
        side={{ label: "Valid for (days)", value: String(settings.websiteSubscriptionDays ?? 0) }}
      />
    );

  return (
    <AdminPage title="Settings" noPanel headerClassName="lg:pl-[28%]">
      {error && (
        <div className="mb-4 flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <FiAlertCircle className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-emerald-700">
          <FiCheckCircle className="mr-2" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          className="flex min-h-[560px] flex-col rounded-2xl border border-gray-500 bg-[#f4f4f4] px-6 py-6"
        >
          <label className={labelClass} htmlFor="settings-mode">
            Mode
          </label>
          <select
            id="settings-mode"
            value={modeId}
            onChange={(e) => setModeId(e.target.value as ModeId)}
            className={`${inputClass} mb-5`}
          >
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          {mode.fields.map(({ key, label, helper, isCurrency }) => (
            <div key={key} className="mb-5">
              <label className={labelClass} htmlFor={key}>
                {label}
              </label>
              <div className="relative">
                {isCurrency && (
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg text-gray-500">
                    $
                  </span>
                )}
                <input
                  id={key}
                  type="number"
                  value={settings[key] ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`${inputClass} ${isCurrency ? "pl-9" : ""}`}
                  min={0}
                  step={isCurrency ? "0.01" : "1"}
                  required
                  disabled={saving}
                  placeholder={isCurrency ? "0.00" : "0"}
                />
              </div>
              {helper && <div className={helperClass}>{helper}</div>}
            </div>
          ))}

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
            <button
              type="submit"
              disabled={saving || !dirty}
              className="bg-[#6b9e2c] px-10 py-2 text-2xl font-semibold text-white transition hover:brightness-95 disabled:cursor-default disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <span className="text-base text-gray-800">
              or{" "}
              <button
                type="button"
                disabled={saving || !dirty}
                onClick={handleReset}
                className="text-blue-700 underline disabled:cursor-default disabled:opacity-50"
              >
                Cancel
              </button>
            </span>
          </div>
        </form>

        <div className="relative min-h-[560px] overflow-hidden rounded-3xl border border-[#a8d05a] bg-white px-6 py-8 sm:px-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-500">Your Current Plan</h2>
            <button
              type="button"
              disabled={saving}
              onClick={() => setReload((x) => x + 1)}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              title="Refresh latest settings"
            >
              <FiRefreshCcw />
              Refresh
            </button>
          </div>
          <div className="mt-6">{preview}</div>
        </div>
      </div>
    </AdminPage>
  );
}
