import { UserCircleIcon } from "../../icons";

// Accept profile as prop (from parent)
// type based on context
type Profile = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  facebookURL?: string;
  linkedinURL?: string;
  twitterURL?: string;
  instagramURL?: string;
  bio?: string;
};

interface UserMetaCardProps {
  profile: Profile;
}

function formatLocation(profile: Profile) {
  // city, state, (pincode)
  const c = profile.city || "";
  const s = profile.state || "";
  const p = profile.pincode ? ` (${profile.pincode})` : "";
  if (!c && !s && !p) return "";
  if (c && s) return `${c}, ${s}${p}`;
  return `${c || s}${p}`;
}

export default function UserMetaCard({ profile }: UserMetaCardProps) {
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <UserCircleIcon className="h-20 w-20" />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {profile.name || <span className="text-gray-400">No Name</span>}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                {/* Optional: Display bio if present */}
                {profile.bio && (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.bio}
                    </p>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                  </>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatLocation(profile) || (
                    <span className="text-gray-300">No Location</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
