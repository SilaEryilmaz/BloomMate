import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "./AnimatedPressable";
import { spacing, useTheme } from "../theme";

type Props = {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
};

export function TopBar({ title, showBack = false, onBackPress, onMenuPress }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.bar, { borderBottomColor: theme.line }]}>
      {showBack ? (
        <AnimatedPressable onPress={onBackPress} style={styles.iconSlot}>
          <Ionicons name="chevron-back" size={22} color={theme.inkMuted} />
        </AnimatedPressable>
      ) : (
        <View style={styles.iconSlot} />
      )}
      <View style={styles.brandWrap}>
        <Text style={[styles.brand, { color: theme.accent }]}>BLOOMMATE</Text>
        <Text style={[styles.subtitle, { color: theme.inkSoft }]}>{title ? title.toUpperCase() : "WELLNESS COMPANION"}</Text>
      </View>
      <AnimatedPressable onPress={onMenuPress} style={styles.iconSlot}>
        <Ionicons name="menu" size={22} color={theme.inkMuted} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs
  },
  brand: {
    fontFamily: "Georgia",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 6
  },
  brandWrap: {
    alignItems: "center",
    flex: 1
  },
  iconSlot: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2.5,
    marginTop: 3
  }
});
