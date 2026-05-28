import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, radii, spacing } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "filled" | "soft" | "outline" | "danger";
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, variant = "filled", style }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, styles[variant], pressed && styles.pressed, style]}>
      <Text style={[styles.label, variant === "filled" || variant === "danger" ? styles.lightLabel : styles.darkLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radii.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  danger: {
    backgroundColor: colors.danger
  },
  darkLabel: {
    color: colors.berryDark
  },
  filled: {
    backgroundColor: colors.berry
  },
  label: {
    fontSize: 15,
    fontWeight: "800"
  },
  lightLabel: {
    color: colors.surface
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: colors.line,
    borderWidth: 1
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }]
  },
  soft: {
    backgroundColor: colors.petal
  }
});
