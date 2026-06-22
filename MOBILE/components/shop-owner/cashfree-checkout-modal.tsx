import { colors, fontSizes, spacing } from "@/constants/autodaddy";
import { buildCashfreeCheckoutHtml } from "@/lib/cashfree-checkout-html";
import {
  fetchCashfreeCustomerCheckoutUrl,
  isCashfreeMerchantApiUrl,
  resolveCashfreeSandbox,
} from "@/lib/cashfree-payment";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type Props = {
  visible: boolean;
  paymentSessionId?: string | null;
  /** Hint for sandbox; ignored if it is a merchant API URL (/payments). */
  paymentUrl?: string | null;
  onClose: () => void;
  onComplete?: () => void;
  onError?: (message: string) => void;
};

const LOADER_MAX_MS = 15_000;

/** Detect Cashfree hosted success page (e.g. "SUCCESS" + "Paid INR") inside WebView. */
const CASHFREE_SUCCESS_PAGE_PROBE = `
(function () {
  var notified = false;
  function notify() {
    if (notified || !window.ReactNativeWebView || !window.ReactNativeWebView.postMessage) return;
    var text = (document.body && document.body.innerText) || "";
    if (/SUCCESS/i.test(text) && /Paid\\s+INR/i.test(text)) {
      notified = true;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "success" }));
    }
  }
  notify();
  setInterval(notify, 1200);
})();
true;
`;

export function CashfreeCheckoutModal({
  visible,
  paymentSessionId,
  paymentUrl,
  onClose,
  onComplete,
  onError,
}: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [webFailed, setWebFailed] = useState(false);
  const [customerUrl, setCustomerUrl] = useState<string | null>(null);
  const [openingBrowser, setOpeningBrowser] = useState(false);
  const loaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const session = paymentSessionId?.trim() ?? "";
  const sandbox = resolveCashfreeSandbox(
    isCashfreeMerchantApiUrl(paymentUrl) ? null : paymentUrl
  );

  const htmlCheckout = useMemo(() => {
    if (!session) return null;
    return buildCashfreeCheckoutHtml(session, sandbox);
  }, [session, sandbox]);

  const webSource = useMemo(() => {
    if (htmlCheckout) {
      return { html: htmlCheckout, baseUrl: "https://sdk.cashfree.com" as const };
    }
    return null;
  }, [htmlCheckout]);

  const clearLoaderTimer = useCallback(() => {
    if (loaderTimerRef.current) {
      clearTimeout(loaderTimerRef.current);
      loaderTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      clearLoaderTimer();
      setCustomerUrl(null);
      return;
    }
    setLoading(true);
    setWebFailed(false);
    setCustomerUrl(null);
    clearLoaderTimer();
    loaderTimerRef.current = setTimeout(() => setLoading(false), LOADER_MAX_MS);
    return clearLoaderTimer;
  }, [clearLoaderTimer, session, visible]);

  const handleLoadEnd = useCallback(() => {
    clearLoaderTimer();
    setLoading(false);
  }, [clearLoaderTimer]);

  const handleOpenInBrowser = useCallback(async () => {
    if (!session) {
      onError?.("Payment session is missing.");
      return;
    }
    setOpeningBrowser(true);
    try {
      let url = customerUrl;
      if (!url) {
        url = await fetchCashfreeCustomerCheckoutUrl(session, sandbox);
      }
      if (!url) {
        onError?.(
          "Could not open payment in browser. Complete payment in the app checkout screen."
        );
        return;
      }
      onClose();
      await Linking.openURL(url);
    } catch {
      onError?.("Could not open payment in browser.");
    } finally {
      setOpeningBrowser(false);
    }
  }, [customerUrl, onClose, onError, sandbox, session]);

  const handleWebMessage = useCallback(
    (raw: string) => {
      try {
        const data = JSON.parse(raw) as { type?: string; message?: string };
        if (data.type === "success") {
          onComplete?.();
          return;
        }
        if (data.type === "error") {
          onError?.(data.message?.trim() || "Payment was not completed.");
        }
      } catch {
        // Ignore non-JSON messages.
      }
    },
    [onComplete, onError]
  );

  const handleNavigationChange = useCallback(
    (navUrl: string) => {
      const lower = navUrl.toLowerCase();
      if (
        lower.includes("payment_success") ||
        lower.includes("payment-success") ||
        lower.includes("status=success") ||
        lower.includes("/success") ||
        (lower.includes("cashfree") && lower.includes("success"))
      ) {
        onComplete?.();
      }
    },
    [onComplete]
  );

  if (!visible) {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete payment</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => void handleOpenInBrowser()}
              hitSlop={8}
              disabled={openingBrowser}
            >
              {openingBrowser ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="open-outline" size={22} color={colors.primary} />
              )}
            </Pressable>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close payment">
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {webFailed ? (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>
              In-app checkout failed to load. Tap below to open the secure Cashfree payment page
              in your browser.
            </Text>
            <Pressable
              style={styles.fallbackBtn}
              onPress={() => void handleOpenInBrowser()}
              disabled={openingBrowser}
            >
              <Text style={styles.fallbackBtnText}>Open secure payment page</Text>
            </Pressable>
          </View>
        ) : webSource ? (
          <View style={styles.webWrap}>
            <WebView
              source={webSource}
              originWhitelist={["*"]}
              injectedJavaScript={CASHFREE_SUCCESS_PAGE_PROBE}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={handleLoadEnd}
              onNavigationStateChange={(e) => handleNavigationChange(e.url)}
              onMessage={(e) => handleWebMessage(e.nativeEvent.data)}
              onError={() => {
                setWebFailed(true);
                setLoading(false);
                clearLoaderTimer();
              }}
              onHttpError={() => {
                setWebFailed(true);
                setLoading(false);
                clearLoaderTimer();
              }}
              javaScriptEnabled
              domStorageEnabled
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              mixedContentMode="always"
              allowsInlineMediaPlayback
              setSupportMultipleWindows={false}
              style={styles.web}
            />
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.loadingText}>Loading Cashfree checkout…</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>Payment session is missing.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  webWrap: {
    flex: 1,
    backgroundColor: colors.white,
  },
  web: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.white,
  },
  fallbackText: {
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  fallbackBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  fallbackBtnText: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.white,
  },
});
