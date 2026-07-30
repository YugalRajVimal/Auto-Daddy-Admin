import { ShopDialogMotion } from "./ShopAnimated";
import { shopCancelButtonClass, shopSaveButtonClass } from "./forms/ShopFormPage";
import type { ShopProfileIncompleteKind } from "../../lib/shopProfileCompleteness";

const COPY: Record<
  ShopProfileIncompleteKind,
  { title: string; body: string; cta: string }
> = {
  personal: {
    title: "Complete your personal profile",
    body: "Add your name, email, and city so customers and your team can recognize you.",
    cta: "Complete personal profile",
  },
  business: {
    title: "Complete your business profile",
    body: "Add your shop name, address, and contact details to finish setting up AutoDaddy.",
    cta: "Complete business profile",
  },
  both: {
    title: "Complete your profile",
    body: "Your personal and business profiles are incomplete. Finish setup to unlock the full shop portal.",
    cta: "Complete profile",
  },
};

type ShopCompleteProfileDialogProps = {
  open: boolean;
  kind: ShopProfileIncompleteKind;
  onComplete: () => void;
  onLater: () => void;
};

export default function ShopCompleteProfileDialog({
  open,
  kind,
  onComplete,
  onLater,
}: ShopCompleteProfileDialogProps) {
  const copy = COPY[kind];

  return (
    <ShopDialogMotion
      open={open}
      onClose={onLater}
      panelClassName="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
    >
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
        <h2 className="text-lg font-bold text-ad-purple">{copy.title}</h2>
      </div>

      <div className="px-5 py-5">
        <p className="text-sm leading-relaxed text-gray-700">{copy.body}</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
        <button type="button" onClick={onLater} className={shopCancelButtonClass}>
          Later
        </button>
        <button type="button" onClick={onComplete} className={shopSaveButtonClass}>
          {copy.cta}
        </button>
      </div>
    </ShopDialogMotion>
  );
}
