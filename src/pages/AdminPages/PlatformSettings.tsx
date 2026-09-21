import { useEffect, useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiRefreshCcw, FiDollarSign } from "react-icons/fi";
import { useAuth } from "../../auth";
import {
  fetchPlatformSettings,
  updatePlatformSettings,
  type PlatformSettings,
} from "../../lib/platformSettingsApi";

const FIELDS: {
  key: keyof PlatformSettings;
  label: string;
  helper?: string;
  isCurrency?: boolean;
}[] = [
  {
    key: "trialDays",
    label: "Free Trial Duration",
    helper: "Number of days users can use the platform for free.",
  },
  {
    key: "minWalletRechargeAmount",
    label: "Minimum Wallet Recharge",
    helper: "Smallest amount allowed for wallet top-ups (in $).",
    isCurrency: true,
  },
  {
    key: "perJobCardCharge",
    label: "Per Job Card Charge",
    helper: "Amount charged per job card (in $).",
    isCurrency: true,
  },
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
];

const labelClass =
  "mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ad-purple";
const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-ad-purple/60 focus:ring-2 focus:ring-ad-purple/10 disabled:bg-slate-50 disabled:opacity-70";
const inputClassNoIcon =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-ad-purple/60 focus:ring-2 focus:ring-ad-purple/10 disabled:bg-slate-50 disabled:opacity-70";
const helperClass = "mt-1 text-xs text-slate-400";

export default function PlatformSettingsPage() {
  const { session } = useAuth();
  const token = session?.token ?? "";
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [original, setOriginal] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

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
      <div className="flex items-center justify-center h-[300px]">
        <span className="animate-spin mr-2 text-ad-purple">
          <FiRefreshCcw size={20} />
        </span>
        <span className="text-[15px] text-gray-400">
          Loading platform settings…
        </span>
      </div>
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
    } catch (err: any) {
      setError(err?.message || "Request failed! Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(original);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-auto transition-all rounded-xl border border-slate-200 bg-white/80 p-10 shadow-lg">
      <h2 className="mb-1 text-2xl font-extrabold text-ad-purple tracking-tight">
        Platform Wallet & Subscription Settings
      </h2>
      <div className="mb-6 text-sm text-slate-500">
        <span>
          Manage global payment and platform billing preferences.
          <br />
          <span className="text-ad-purple font-semibold">
            All changes apply instantly for new transactions.
          </span>
        </span>
      </div>

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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className=""
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7 pb-8">
          {FIELDS.map(({ key, label, helper, isCurrency }) => (
            <div key={key}>
              <label className={labelClass} htmlFor={key}>
                {label}
              </label>
              <div className="relative">
                {isCurrency && (
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-lg">
                    <FiDollarSign />
                  </span>
                )}
                <input
                  id={key}
                  type="number"
                  value={settings[key] ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={isCurrency ? inputClass : inputClassNoIcon}
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
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !dirty}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold transition text-base shadow ${
              dirty
                ? "bg-ad-purple hover:bg-ad-purple/90 text-white"
                : "bg-slate-100 text-slate-400 cursor-default"
            } ${saving ? "opacity-60" : ""}`}
          >
            {saving ? (
              <span className="flex items-center gap-1">
                <FiRefreshCcw className="animate-spin" /> Saving…
              </span>
            ) : (
              <>
                <FiCheckCircle /> Save Settings
              </>
            )}
          </button>
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={handleReset}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold border transition text-base shadow
              ${
                dirty
                  ? "border-ad-purple text-ad-purple hover:bg-ad-purple/10"
                  : "border-slate-200 text-slate-300 cursor-default"
              }
              ${saving ? "opacity-70" : ""}
            `}
          >
            <FiRefreshCcw />
            Reset
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setReload((x) => x + 1);
            }}
            className="ml-auto flex items-center gap-2 rounded-xl px-5 py-2.5 text-base font-medium text-slate-500 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition shadow"
            title="Refresh latest settings"
          >
            <FiRefreshCcw />
            Refresh
          </button>
        </div>
      </form>
    </div>
  );
}