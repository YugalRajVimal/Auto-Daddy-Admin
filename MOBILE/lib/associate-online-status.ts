import * as SecureStore from "expo-secure-store";

const KEY = "associate_online_status";

export async function getAssociateOnlineStatus(): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (raw === "0") return false;
  return true;
}

export async function setAssociateOnlineStatus(online: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEY, online ? "1" : "0");
}
