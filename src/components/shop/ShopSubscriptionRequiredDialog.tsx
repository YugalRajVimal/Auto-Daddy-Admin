import { ShopDialogMotion } from "./ShopAnimated";
import { shopCancelButtonClass, shopSaveButtonClass } from "./forms/ShopFormPage";

type ShopSubscriptionRequiredDialogProps = {
  open: boolean;
  onSubscribe: () => void;
  onLater: () => void;
};

export default function ShopSubscriptionRequiredDialog({
  open,
  onSubscribe,
  onLater,
}: ShopSubscriptionRequiredDialogProps) {
  return (
    <ShopDialogMotion
      open={open}
      onClose={onLater}
      panelClassName="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
    >
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
        <h2 className="text-lg font-bold text-ad-purple">Subscription required</h2>
      </div>

      <div className="px-5 py-5">
        <p className="text-sm leading-relaxed text-gray-700">
          Purchase an active subscription to use this feature. You can still update your profile
          and buy a plan from My website.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
        <button type="button" onClick={onLater} className={shopCancelButtonClass}>
          Not now
        </button>
        <button type="button" onClick={onSubscribe} className={shopSaveButtonClass}>
          View plans
        </button>
      </div>
    </ShopDialogMotion>
  );
}
