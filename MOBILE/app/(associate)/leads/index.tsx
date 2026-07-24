import { AssociateScrollScreenFrame } from "@/components/associate";
import { associateColors } from "@/constants/associate-theme";
import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import {
  DUMMY_ASSOCIATE_LEADS,
  type DummyLead,
  type DummyLeadStatus,
} from "@/lib/associate-dummy-data";
import { navigateToAppHome } from "@/lib/shop-owner-navigation";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

function LeadStatusIcon({ status }: { status: DummyLeadStatus }) {
  if (status === "approved") {
    return <Ionicons name="checkmark-circle" size={22} color={associateColors.onlineDot} />;
  }
  return <Ionicons name="close-circle" size={22} color={associateColors.offlineDot} />;
}

function LeadRow({
  lead,
  onView,
}: {
  lead: DummyLead;
  onView: (lead: DummyLead) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.nameCol]} numberOfLines={1}>
        {lead.name}
      </Text>
      <Text style={[styles.cell, styles.cityCol]} numberOfLines={1}>
        {lead.city}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${lead.name}`}
        onPress={() => onView(lead)}
        style={({ pressed }) => [styles.viewBtn, pressed && styles.viewBtnPressed]}
      >
        <Ionicons name="eye-outline" size={20} color={associateColors.primaryDark} />
      </Pressable>
      <View style={styles.statusCol}>
        <LeadStatusIcon status={lead.status} />
      </View>
    </View>
  );
}

export default function AssociateLeadsPage() {
  const [selected, setSelected] = useState<DummyLead | null>(null);

  const closeDetail = useCallback(() => setSelected(null), []);

  return (
    <AssociateScrollScreenFrame
      title="My Leads"
      showTabBar={false}
      leadingMode="back"
      onBackPress={() => navigateToAppHome("/(associate)/(tabs)/home")}
    >
      <Text style={styles.subtitle}>Shops assigned from the admin panel (sample data).</Text>

      <View style={styles.table}>
        <View style={styles.headRow}>
          <Text style={[styles.th, styles.nameCol]}>Shop</Text>
          <Text style={[styles.th, styles.cityCol]}>City</Text>
          <Text style={[styles.th, styles.viewCol]}>View</Text>
          <Text style={[styles.th, styles.statusCol]}>Status</Text>
        </View>

        {DUMMY_ASSOCIATE_LEADS.map((lead, index) => (
          <View
            key={lead.id}
            style={[styles.rowWrap, index % 2 === 1 ? styles.rowWrapAlt : null]}
          >
            <LeadRow lead={lead} onView={setSelected} />
          </View>
        ))}
      </View>

      <Modal visible={selected != null} transparent animationType="fade" onRequestClose={closeDetail}>
        <Pressable style={styles.modalBackdrop} onPress={closeDetail}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{selected?.name ?? ""}</Text>
            <Text style={styles.modalLine}>
              <Text style={styles.modalLabel}>City: </Text>
              {selected?.city}
            </Text>
            <Text style={styles.modalLine}>
              <Text style={styles.modalLabel}>Contact: </Text>
              {selected?.contactName ?? "—"}
            </Text>
            <Text style={styles.modalLine}>
              <Text style={styles.modalLabel}>Phone: </Text>
              {selected?.phone ?? "—"}
            </Text>
            <View style={styles.modalStatusRow}>
              <Text style={styles.modalLabel}>Status: </Text>
              {selected ? <LeadStatusIcon status={selected.status} /> : null}
              <Text style={styles.modalStatusText}>
                {selected?.status === "approved" ? "Approved" : "Rejected"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={closeDetail}
              style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.viewBtnPressed]}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AssociateScrollScreenFrame>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  table: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: associateColors.quickActionBorder,
    overflow: "hidden",
    ...shadows.card,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: associateColors.primaryMuted,
    gap: spacing.xs,
  },
  th: {
    fontSize: fontSizes.xs,
    fontWeight: "900",
    color: associateColors.badgeText,
    letterSpacing: 0.3,
  },
  rowWrap: { backgroundColor: colors.white },
  rowWrapAlt: { backgroundColor: associateColors.primaryMutedBg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cell: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.text,
  },
  nameCol: { flex: 2, minWidth: 0 },
  cityCol: { flex: 1.2, minWidth: 0 },
  viewCol: { width: 44, textAlign: "center" },
  statusCol: { width: 36, alignItems: "center" },
  viewBtn: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  viewBtnPressed: { opacity: 0.7 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalLine: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 22,
  },
  modalLabel: {
    fontWeight: "800",
    color: colors.textMuted,
  },
  modalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  modalStatusText: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
  },
  modalCloseBtn: {
    marginTop: spacing.md,
    alignSelf: "stretch",
    backgroundColor: associateColors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: fontSizes.md,
    fontWeight: "900",
    color: colors.white,
  },
});
