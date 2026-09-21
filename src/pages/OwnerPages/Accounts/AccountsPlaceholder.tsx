import { FiClock } from "react-icons/fi";
import OwnerPageShell from "../../../components/owner/OwnerPageShell";

/** Accounts sections drawn in the mockups that have no backend support yet. */
function AccountsPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <OwnerPageShell pageHeading={title} metaTitle={`${title} | AutoDaddy`} metaDescription={description}>
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl bg-[#d4fcd4] p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-ad-purple shadow-sm">
          <FiClock size={26} aria-hidden />
        </span>
        <p className="text-lg font-semibold text-gray-800">{title} is coming soon</p>
        <p className="max-w-md text-sm text-gray-600">{description}</p>
      </div>
    </OwnerPageShell>
  );
}

export function OwnerJobCardPaymentPage() {
  return (
    <AccountsPlaceholder
      title="Job Card Payment"
      description="Record payments against your job cards. Until then, you can enter payments from Accounts › Invoices."
    />
  );
}

export function OwnerAccountsExpensesPage() {
  return <AccountsPlaceholder title="Expenses" description="Track your other vehicle expenses in one place." />;
}

export function OwnerManageBanksPage() {
  return <AccountsPlaceholder title="Manage Banks" description="Save the bank accounts and cards you pay shops with." />;
}
