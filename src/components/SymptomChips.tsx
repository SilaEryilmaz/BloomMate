import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../theme";

export const SYMPTOMS = ["Cramps", "Tender", "Headache", "Tired", "Bloated", "Cravings", "Calm", "Moody"];

type Props = {
  selected: string[];
  onChange: (symptoms: string[]) => void;
};

export function SymptomChips({ selected, onChange }: Props) {
  const toggle = (symptom: string) => {
    onChange(selected.includes(symptom) ? selected.filter((item) => item !== symptom) : [...selected, symptom]);
  };

  return (
    <View style={styles.wrap}>
      {SYMPTOMS.map((symptom) => {
        const active = selected.includes(symptom);
        return (
          <Pressable key={symptom} onPress={() => toggle(symptom)} style={[styles.chip, active && styles.active]}>
            <Text style={[styles.label, active && styles.activeLabel]}>{symptom}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  active: {
    backgroundColor: colors.mint,
    borderColor: colors.mint
  },
  activeLabel: {
    color: colors.berryDark
  },
  chip: {
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  label: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "800"
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
