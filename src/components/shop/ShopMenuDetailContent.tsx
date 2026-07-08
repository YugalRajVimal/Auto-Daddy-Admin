type ShopMenuDetailContentProps = {
  onClose?: () => void;
};

const PRIVACY_POLICY_SECTIONS = [
  {
    title: "Information we collect",
    body: "We collect account details you provide when registering your shop, including business name, contact information, and service listings. Usage data such as logins and feature interactions may also be stored to improve the platform.",
  },
  {
    title: "How we use your information",
    body: "Your information is used to operate your AutoDaddy shop profile, process subscriptions, send service-related notifications, and display your business to car owners searching for auto services in your area.",
  },
  {
    title: "Sharing with third parties",
    body: "We do not sell your personal information. Limited data may be shared with payment processors, analytics providers, and parts partners only when required to deliver a feature you use.",
  },
  {
    title: "Your choices",
    body: "You may update your business profile, manage notification preferences, or request account deletion by contacting support. Some data may be retained as required by law or for legitimate business records.",
  },
] as const;

export default function ShopMenuDetailContent({ onClose }: ShopMenuDetailContentProps) {
  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-[#006600]">Privacy Policy</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-gray-700">
        <p className="rounded-md bg-[#DFFFD6] px-3 py-2 text-xs text-[#006600]">
          Last updated: June 1, 2026. This is placeholder policy text for preview purposes.
        </p>

        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{section.title}</p>
            <p className="mt-1">{section.body}</p>
          </div>
        ))}
      </div>
    </>
  );
}
