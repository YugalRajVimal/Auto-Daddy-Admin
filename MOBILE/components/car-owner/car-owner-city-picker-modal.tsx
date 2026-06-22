import { colors, fontSizes, shadows, spacing, typography } from "@/constants/autodaddy";
import { ModalKeyboardRoot } from "@/components/reusables";
import { usePaginatedUserCities } from "@/hooks/use-paginated-user-cities";
import type { UserCity } from "@/types/user-cities";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WINDOW_H = Dimensions.get("window").height;

type Props = {
  visible: boolean;
  onClose: () => void;
  authToken: string | null;
  selectedId: string | null;
  onSelect: (city: UserCity) => void;
};

export function CarOwnerCityPickerModal({ visible, onClose, authToken, selectedId, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!visible) {
      setSearch("");
      setDebouncedSearch("");
    }
  }, [visible]);

  const { items, loading, loadingMore, hasMore, loadMore } = usePaginatedUserCities(
    authToken,
    visible,
    debouncedSearch
  );

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <ModalKeyboardRoot onBackdropPress={onClose} scrimColor="rgba(0,0,0,0.42)">
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Select city</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close city picker">
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.textLight} style={styles.searchIcon} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search cities…"
              placeholderTextColor={colors.textLight}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {loading && items.length === 0 ? (
            <View style={styles.centerPad}>
              <ActivityIndicator color={colors.successDark} />
              <Text style={styles.muted}>Loading cities…</Text>
            </View>
          ) : null}

          {!loading && items.length === 0 ? (
            <View style={styles.centerPad}>
              <Text style={styles.emptyTitle}>No cities found</Text>
              <Text style={styles.muted}>Try a different search.</Text>
            </View>
          ) : null}

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            style={[styles.list, { maxHeight: WINDOW_H * 0.5 }]}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const selected = selectedId != null && item.id === selectedId;
              return (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed, selected && styles.rowSelected]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={[styles.rowText, selected && styles.rowTextSelected]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.successDark} /> : null}
                </Pressable>
              );
            }}
            onEndReached={() => {
              if (hasMore && !loading && !loadingMore) loadMore();
            }}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator size="small" color={colors.successDark} />
                </View>
              ) : null
            }
          />
        </View>
      </ModalKeyboardRoot>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    ...shadows.card,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.trackBg,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.text },
  closeBtn: { padding: 6 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    borderRadius: 14,
    paddingHorizontal: 10,
    marginBottom: spacing.sm,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: colors.text,
  },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { opacity: 0.85 },
  rowSelected: { backgroundColor: colors.successMuted, marginHorizontal: -4, paddingHorizontal: 8, borderRadius: 12 },
  rowText: { ...typography.body, flex: 1, fontWeight: "700", color: colors.text },
  rowTextSelected: { color: colors.successDark },
  centerPad: { paddingVertical: spacing.lg, alignItems: "center", gap: spacing.xs },
  emptyTitle: { fontSize: fontSizes.md, fontWeight: "900", color: colors.text },
  muted: { ...typography.bodyMuted },
  footer: { paddingVertical: spacing.md, alignItems: "center" },
});
