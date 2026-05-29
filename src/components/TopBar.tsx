import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../theme";

type Props = {
  title?: string;
  showBack?: boolean;
  onMenuPress?: () => void;
};

export function TopBar({ title, showBack = false, onMenuPress }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.iconSlot}>{showBack ? <Ionicons name="chevron-back" size={24} color={colors.ink} /> : null}</View>
      {title ? <Text style={styles.title}>{title}</Text> : <View />}
      <Pressable onPress={onMenuPress} style={styles.iconSlot}>
        <Ionicons name="menu" size={24} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.md
  },
  iconSlot: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  }
});
