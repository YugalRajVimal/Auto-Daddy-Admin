import { isCashfreeNativeAvailable } from "@/lib/cashfree-payment";
import { useEffect, useRef } from "react";
import {
  type CFCallback,
  type CFErrorResponse,
  CFPaymentGatewayService,
} from "react-native-cashfree-pg-sdk";

type CashfreePaymentCallbackHandlers = {
  onVerify: (orderId: string) => void;
  onError: (error: CFErrorResponse, orderId: string) => void;
};

/** Registers Cashfree PG callbacks for the screen lifetime (required before doWebPayment). */
export function useCashfreePaymentCallback(handlers: CashfreePaymentCallbackHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!isCashfreeNativeAvailable()) {
      return undefined;
    }
    const callback: CFCallback = {
      onVerify(orderID: string) {
        handlersRef.current.onVerify(orderID);
      },
      onError(error: CFErrorResponse, orderID: string) {
        handlersRef.current.onError(error, orderID);
      },
    };
    CFPaymentGatewayService.setCallback(callback);
    return () => {
      CFPaymentGatewayService.removeCallback();
    };
  }, []);
}
