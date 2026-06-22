import { useToast } from "@/components/reusables";
import { useAuth } from "@/context/auth-provider";
import { router } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";

type UseLogoutActionOptions = {
  onLoggedOut?: () => void;
};

export function useLogoutAction(options?: UseLogoutActionOptions) {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const onLoggedOut = options?.onLoggedOut;

  return useCallback(async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert("Log out?", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Log out", style: "destructive", onPress: () => resolve(true) },
      ]);
    });
    if (!confirmed) {
      return;
    }

    await logout();
    onLoggedOut?.();
    showToast("Logged out successfully", { type: "success" });
    // In some navigator trees there is no stack to dismiss; `dismissAll()` can trigger
    // an unhandled POP_TO_TOP warning. `login` already resets itself on focus.
    router.replace("/login");
  }, [logout, onLoggedOut, showToast]);
}
