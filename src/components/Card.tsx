import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { radii, spacing, useTheme } from "../theme";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ children, style }: Props) {
  const theme = useTheme();

  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line, shadowColor: theme.ink }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.025,
    shadowRadius: 22
  }
});
