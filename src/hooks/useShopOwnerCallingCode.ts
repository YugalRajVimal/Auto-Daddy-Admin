import useAuth from "../auth/useAuth";

export function useShopOwnerCallingCode() {
  const { session } = useAuth();
  return session?.meta?.countryCode ?? "+1";
}
