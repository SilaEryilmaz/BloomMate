import { StyleSheet, Text, ViewStyle } from "react-native";

import { AnimatedPressable } from "./AnimatedPressable";
import { colors, spacing, useTheme } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "filled" | "soft" | "outline" | "danger";
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, variant = "filled", style }: Props) {
  const theme = useTheme();
  const variantStyle =
    variant === "filled"
      ? { backgroundColor: theme.accent }
      : variant === "soft"
        ? { backgroundColor: theme.accentSoft }
        : variant === "outline"
          ? { backgroundColor: "transparent", borderColor: theme.line, borderWidth: 1 }
          : styles.danger;
  const labelStyle = variant === "filled" || variant === "danger" ? { color: theme.surface } : { color: theme.accentDark };

  return (
    <AnimatedPressable onPress={onPress} style={[styles.button, variantStyle, style]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  danger: {
    backgroundColor: colors.danger
  },
  label: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3
  }
});
