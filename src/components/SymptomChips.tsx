import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "./AnimatedPressable";
import { radii, spacing, useTheme } from "../theme";

export const SYMPTOMS = [
  "Cramps",
  "Tender",
  "Headache",
  "Bloated",
  "Tired",
  "Backache",
  "Nausea",
  "Acne",
  "Sleepy",
  "Sore",
  "Calm",
  "Happy",
  "Energetic",
  "Focused",
  "Confident",
  "Relaxed",
  "Moody",
  "Sensitive",
  "Anxious",
  "Cravings"
];

const GROUPS = [
  {
    title: "Body & Physical",
    meta: "Symptoms",
    items: [
      { id: "Cramps", icon: "⚡" },
      { id: "Tender", icon: "🌸" },
      { id: "Headache", icon: "🧠" },
      { id: "Bloated", icon: "🎈" },
      { id: "Tired", icon: "😴" },
      { id: "Backache", icon: "🌿" },
      { id: "Nausea", icon: "🍵" },
      { id: "Acne", icon: "✨" },
      { id: "Sleepy", icon: "🌙" },
      { id: "Sore", icon: "🫶" }
    ],
    activeStyle: "physical" as const
  },
  {
    title: "Mood & Mind",
    meta: "Emotional state",
    items: [
      { id: "Calm", icon: "🧘‍♀️" },
      { id: "Happy", icon: "😊" },
      { id: "Energetic", icon: "⚡" },
      { id: "Focused", icon: "🎯" },
      { id: "Confident", icon: "💫" },
      { id: "Relaxed", icon: "☁️" },
      { id: "Moody", icon: "🌪️" },
      { id: "Sensitive", icon: "🥺" },
      { id: "Anxious", icon: "🌧️" },
      { id: "Cravings", icon: "🍫" }
    ],
    activeStyle: "mood" as const
  }
];

type Props = {
  selected: string[];
  onChange: (symptoms: string[]) => void;
};

export function SymptomChips({ selected, onChange }: Props) {
  const theme = useTheme();
  const toggle = (symptom: string) => {
    onChange(selected.includes(symptom) ? selected.filter((item) => item !== symptom) : [...selected, symptom]);
  };

  return (
    <View style={styles.groups}>
      {GROUPS.map((group) => (
        <View key={group.title} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={[styles.groupTitle, { color: theme.ink }]}>{group.title}</Text>
            <Text style={[styles.groupMeta, { color: theme.inkMuted }]}>{group.meta}</Text>
          </View>
          <View style={styles.wrap}>
            {group.items.map((symptom) => {
              const active = selected.includes(symptom.id);
              return (
                <AnimatedPressable
                  key={symptom.id}
                  onPress={() => toggle(symptom.id)}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.surface, borderColor: theme.line },
                    active && {
                      backgroundColor: group.activeStyle === "physical" ? theme.secondary : theme.tertiary,
                      borderColor: group.activeStyle === "physical" ? theme.secondary : theme.tertiary
                    }
                  ]}
                >
                  <Text style={[styles.label, { color: active ? theme.surface : theme.inkMuted }]}>
                    <Text>{symptom.icon} </Text>
                    {symptom.id}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  group: {
    gap: spacing.sm
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  groupMeta: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  groupTitle: {
    fontFamily: "Georgia",
    fontSize: 17,
    fontWeight: "900"
  },
  groups: {
    gap: spacing.lg
  },
  label: {
    fontSize: 13,
    fontWeight: "800"
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
