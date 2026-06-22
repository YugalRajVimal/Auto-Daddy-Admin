import { associateColors } from "@/constants/associate-theme";
import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import type { DummyWebsite } from "@/lib/associate-dummy-data";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const PREVIEW_HEIGHT_RATIO = 0.28;
const PREVIEW_MIN = 160;
const PREVIEW_MAX = 220;

type Props = {
  website: DummyWebsite;
};

export function AssociateWebsitePreviewCard({ website }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const previewHeight = Math.round(
    Math.min(Math.max(windowHeight * PREVIEW_HEIGHT_RATIO, PREVIEW_MIN), PREVIEW_MAX)
  );
  const [webLoading, setWebLoading] = useState(true);
  const [webError, setWebError] = useState(false);

  const openLive = useCallback(() => {
    Linking.openURL(website.previewUrl).catch(() => undefined);
  }, [website.previewUrl]);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.name}>{website.name}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open live preview"
          onPress={openLive}
          style={({ pressed }) => [styles.liveBtn, pressed && styles.liveBtnPressed]}
        >
          <Text style={styles.liveBtnText}>Live</Text>
          <Ionicons name="open-outline" size={14} color={colors.white} />
        </Pressable>
      </View>
      <Text style={styles.desc}>{website.description}</Text>

      <View style={[styles.previewWrap, { height: previewHeight }]}>
        {webError ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Preview unavailable. Tap Live to open in browser.</Text>
          </View>
        ) : (
          <View style={styles.webWrap}>
            <WebView
              source={{ uri: website.previewUrl }}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              mixedContentMode="always"
              onLoadStart={() => {
                setWebError(false);
                setWebLoading(true);
              }}
              onLoadEnd={() => setWebLoading(false)}
              onError={() => {
                setWebLoading(false);
                setWebError(true);
              }}
              onHttpError={() => {
                setWebLoading(false);
                setWebError(true);
              }}
              style={styles.webView}
            />
            {webLoading ? (
              <View pointerEvents="none" style={styles.webOverlay}>
                <ActivityIndicator color={associateColors.primary} />
              </View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.hero,
    borderWidth: 1,
    borderColor: associateColors.quickActionBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: colors.text,
  },
  desc: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
    lineHeight: 18,
  },
  liveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    backgroundColor: associateColors.primary,
  },
  liveBtnPressed: { opacity: 0.88 },
  liveBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.white,
  },
  previewWrap: {
    borderRadius: radii.xxl,
    overflow: "hidden",
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  webWrap: { flex: 1 },
  webView: { flex: 1, backgroundColor: colors.white },
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,251,235,0.85)",
  },
  banner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  bannerText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: associateColors.badgeText,
    textAlign: "center",
  },
});
