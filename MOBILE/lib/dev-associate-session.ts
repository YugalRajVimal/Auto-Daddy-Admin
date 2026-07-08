import type { AuthSessionMeta } from "@/lib/auth";

/** Local-only token; never sent to real auth endpoints. */
export const DEV_ASSOCIATE_TOKEN = "__dev_associate_session__";

export function isDevAssociateToken(token: string | null | undefined): boolean {
  return token === DEV_ASSOCIATE_TOKEN;
}

export function createDevAssociateMeta(): AuthSessionMeta {
  return {
    role: "associate",
    name: "Demo Associate",
    isProfileComplete: true,
    isAutoShopBusinessProfileComplete: null,
    profilePhoto: null,
    phone: null,
    countryCode: null,
  };
}
