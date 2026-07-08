import type { NetInfoState } from "@react-native-community/netinfo";

export const OFFLINE_TOAST_MESSAGE =
  "No internet connection. Please check your network and try again.";

export function isNetworkOffline(
  state: Pick<NetInfoState, "isConnected" | "isInternetReachable">
): boolean {
  if (state.isConnected === false) {
    return true;
  }
  if (state.isInternetReachable === false) {
    return true;
  }
  return false;
}
