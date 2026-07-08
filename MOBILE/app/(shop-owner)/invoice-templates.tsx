import { DocumentTemplatePanel } from "@/components/document-templates/document-template-panel";
import { StackScreenFrame } from "@/components/reusables";
import { colors } from "@/constants/autodaddy";
import { resolveShopOwnerBackTo } from "@/lib/shop-owner-navigation";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function InvoiceTemplatesPage() {
  const params = useLocalSearchParams<{ backTo?: string | string[]; from?: string | string[] }>();
  const backToParam = Array.isArray(params.backTo) ? params.backTo[0] : params.backTo;
  const fromParam = Array.isArray(params.from) ? params.from[0] : params.from;
  const backTo = resolveShopOwnerBackTo(backToParam, fromParam);

  return (
    <StackScreenFrame
      title="Invoice Templates"
      backgroundColor={colors.bgProfile}
      scroll={false}
      backTo={backTo}
      headerGradient={[colors.tabBarBg, colors.tabBarBg, colors.tabBarBg]}
    >
      <View style={styles.root}>
        <DocumentTemplatePanel kind="invoice" />
      </View>
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
