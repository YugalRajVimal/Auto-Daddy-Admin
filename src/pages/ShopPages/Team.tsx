import { useEffect, useState } from "react";
import { Link } from "react-router";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopListPanel, ShopLoadingPanel } from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
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
  const [members, setMembers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

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
        <Link to="/shop/team/new" className="rounded-md bg-[#008000] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006600]">
          + Add
        </Link>
      }
    >
      {loading ? (
        <ShopLoadingPanel />
      ) : (
        <ShopListPanel>
          {members.length === 0 ? (
            <p className="text-sm text-gray-600">No team members yet.</p>
          ) : (
            members.map((m) => {
              const id = String(m._id ?? m.id ?? "");
              return (
                <div key={id} className="flex items-center justify-between rounded-md bg-[#CCFFCC] px-4 py-3">
                  <div>
                    <p className="font-bold text-gray-900">{String(m.name ?? "")}</p>
                    <p className="text-sm text-gray-600">{String(m.designation ?? "")}</p>
                    <p className="text-sm text-blue-700">{String(m.phone ?? "")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/shop/team/${id}/edit`} className="text-xs font-semibold text-ad-purple hover:underline">Edit</Link>
                    <button type="button" className="text-xs font-semibold text-red-600" onClick={() => void handleDelete(id)}>Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </ShopListPanel>
      )}
    </ShopPageShell>
  );
}
