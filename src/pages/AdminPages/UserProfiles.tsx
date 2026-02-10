import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { UserCircleIcon } from "../../icons";

type Profile = {
  name?: string;
  email?: string;
  phoneNo?: string;
  address?: {
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
    bio?: string;
  };
};

export default function SubAdminUserProfiles() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("sub-admin-token");
        const apiRoute = "/api/sub-admin/get-profile-details";

        if (!token) {
          setError("No sub-admin token found.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_API_URL || ""}${apiRoute}`,
          {
            headers: { Authorization: token },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch profile.");
        }

        setProfile(data.profile || data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <>
      <PageMeta
        title="Auto Daddy"
        description="Admin and Sub-Admin Panel for Auto Daddy"
      />
      <PageBreadcrumb pageTitle="Profile" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>

        {loading ? (
          <div className="flex items-center justify-center min-h-[120px]">
            <div className="w-8 h-8 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 mb-6 text-red-600 bg-red-100 border border-red-300 rounded-md">
            {error}
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                  <div className="w-20 h-20 flex items-center justify-center overflow-hidden border border-gray-200 rounded-full bg-gray-100 dark:border-gray-800">
                    <UserCircleIcon className="h-20 w-20 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-center xl:text-left text-gray-800 dark:text-white/90">
                      {profile.name || <span className="text-gray-400">No Name</span>}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                Personal Information
              </h4>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profile.name || <span className="text-gray-400">-</span>}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profile.email || <span className="text-gray-400">-</span>}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profile.phoneNo || <span className="text-gray-400">-</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                Address
              </h4>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Address Line</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profile.address?.addressLine || <span className="text-gray-400">-</span>}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">City</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profile.address?.city || <span className="text-gray-400">-</span>}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">State</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profile.address?.state || <span className="text-gray-400">-</span>}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Pincode</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profile.address?.pincode || <span className="text-gray-400">-</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No profile details found.</div>
        )}
      </div>
    </>
  );
}
