import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../theme";
import { FlowLevel } from "../types";

const FLOW_OPTIONS: FlowLevel[] = ["none", "light", "medium", "heavy"];

type Props = {
  value: FlowLevel;
  onChange: (flow: FlowLevel) => void;
};

export function FlowSelector({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {FLOW_OPTIONS.map((flow) => {
        const selected = value === flow;
        return (
          <Pressable key={flow} onPress={() => onChange(flow)} style={[styles.option, selected && styles.selected]}>
            <Text style={[styles.label, selected && styles.selectedLabel]}>{flow}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  option: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderRadius: radii.sm,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.xs
  },
  row: {
    flexDirection: "row",
    gap: spacing.xs
  },
  selected: {
    backgroundColor: colors.coral
  },
  selectedLabel: {
    color: colors.surface
  }
});
