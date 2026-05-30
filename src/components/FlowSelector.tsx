import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "./AnimatedPressable";
import { AppPalette, radii, spacing, useTheme } from "../theme";
import { FlowLevel } from "../types";

const FLOW_OPTIONS: FlowLevel[] = ["none", "light", "medium", "heavy"];

type Props = {
  value: FlowLevel;
  onChange: (flow: FlowLevel) => void;
};

export function FlowSelector({ value, onChange }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {FLOW_OPTIONS.map((flow) => {
        const selected = value === flow;
        return (
          <AnimatedPressable
            key={flow}
            onPress={() => onChange(flow)}
            style={[
              styles.option,
              { backgroundColor: theme.surface, borderColor: theme.line },
              selected && { backgroundColor: theme.accentSoft, borderColor: theme.accent }
            ]}
          >
            <Ionicons
              name={selected || flow === "none" ? "water" : "water-outline"}
              size={24}
              color={selected ? flowColor(flow, theme) : theme.inkMuted}
            />
            <Text style={[styles.label, { color: selected ? theme.accent : theme.inkMuted }]}>{flow}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

function flowColor(flow: FlowLevel, theme: AppPalette) {
  if (flow === "heavy") {
    return theme.accentDark;
  }
  if (flow === "medium") {
    return theme.secondary;
  }
  if (flow === "light") {
    return theme.tertiary;
  }
  return theme.inkMuted;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.xs,
    textTransform: "capitalize"
  },
  option: {
    alignItems: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 80,
    justifyContent: "center",
    paddingHorizontal: spacing.xs
  },
  row: {
    flexDirection: "row",
    gap: spacing.xs
  }
});
