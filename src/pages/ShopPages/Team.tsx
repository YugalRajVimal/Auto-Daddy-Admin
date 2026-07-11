import { useEffect, useState } from "react";
import { Link } from "react-router";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopListPanel, ShopLoadingPanel, ShopPageContentShell } from "../../components/shop/ShopPanels";
import { shopHeroOnImageMutedTextClass } from "../../components/shop/shopLayoutStyles";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { deleteTeamMember, fetchTeamMembers } from "../../lib/shopOwnerMutations";
import { toast } from "react-toastify";

function parseMembers(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;
  const arr = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (data as Record<string, unknown>).teamMembers
      : root.teamMembers;
  return Array.isArray(arr) ? (arr as Array<Record<string, unknown>>) : [];
}

export default function ShopTeamPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [members, setMembers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [faqsOpen, setFaqsOpen] = useState(false);

  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetchTeamMembers(token);
    if (res.ok) setMembers(parseMembers(res.data));
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm("Remove this team member?")) return;
    const res = await deleteTeamMember(token, id);
    if (res.ok) {
      toast.success("Removed.");
      void refresh();
    } else {
      toast.error("Could not remove.");
    }
  };

  return (
    <ShopPageShell
      title="Team Members"
      metaTitle="Team | AutoDaddy"
      metaDescription="Shop team members"
      headerAction={
        <Link
          to="/shop/team/new"
          className="rounded-md bg-[#008000] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006600]"
        >
          + Add
        </Link>
      }
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <ShopPageContentShell>
        {loading ? (
          <ShopLoadingPanel variant="team-row" count={4} />
        ) : (
          <ShopListPanel>
          {members.length === 0 ? (
            <p className={`text-sm ${shopHeroOnImageMutedTextClass}`}>No team members yet.</p>
          ) : (
            members.map((m) => {
              const id = String(m._id ?? m.id ?? "");
              return (
                <div key={id} className="flex items-center justify-between rounded-md bg-[#CCFFCC] px-4 py-3">
                  <div>
                    <Link
                      to={`/shop/team/${id}/edit`}
                      className="font-bold text-blue-700 underline hover:text-blue-800"
                      aria-label={`Edit ${String(m.name ?? "team member")}`}
                    >
                      {String(m.name ?? "")}
                    </Link>
                    <p className="text-sm text-gray-600">{String(m.designation ?? "")}</p>
                    <p className="text-sm text-blue-700">{String(m.phone ?? "")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="text-xs font-semibold text-red-600" onClick={() => void handleDelete(id)}>Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </ShopListPanel>
        )}
      </ShopPageContentShell>
    </ShopPageShell>
  );
}
