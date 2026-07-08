import { useEffect, useState } from "react";
import { Keyboard, type KeyboardEvent, Platform } from "react-native";

/**
 * Live keyboard overlap height for padding scroll content (works with edge-to-edge Android
 * where KeyboardAvoidingView / adjustResize are unreliable).
 */
export function useKeyboardBottomInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      setInset(Math.max(0, e.endCoordinates?.height ?? 0));
    };
    const onHide = () => setInset(0);

    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return inset;
}
