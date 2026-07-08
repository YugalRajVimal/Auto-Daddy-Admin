import { isNetworkOffline } from "@/lib/network-connectivity";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkConnectivity() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const apply = (state: NetInfoState) => {
      setIsOffline(isNetworkOffline(state));
    };

    const unsubscribe = NetInfo.addEventListener(apply);
    void NetInfo.fetch().then(apply);

    return unsubscribe;
  }, []);

  return { isOffline };
}
