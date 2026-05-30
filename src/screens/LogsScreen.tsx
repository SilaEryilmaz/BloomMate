import { addDays, format, parseISO } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedEntrance } from "../components/AnimatedEntrance";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Card } from "../components/Card";
import { FlowSelector } from "../components/FlowSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { SymptomChips } from "../components/SymptomChips";
import { TopBar } from "../components/TopBar";
import { upsertDailyLog } from "../data/storage";
import { colors, radii, spacing, typography, useTheme } from "../theme";
import { FlowLevel, ScreenProps } from "../types";
import { getLogForDate, todayKey } from "../utils/cycle";

type Props = ScreenProps & {
  onBackPress: () => void;
  openMenu: () => void;
  selectedDate: string | null;
};

export function LogsScreen({ data, refreshData, onBackPress, selectedDate, openMenu }: Props) {
  const theme = useTheme();
  const [date, setDate] = useState(selectedDate ?? todayKey());
  const dailyLog = useMemo(() => getLogForDate(data.logs, date), [data.logs, date]);
  const [flow, setFlow] = useState<FlowLevel>(dailyLog?.flow ?? "none");
  const [symptoms, setSymptoms] = useState<string[]>(dailyLog?.symptoms ?? []);
  const [notes, setNotes] = useState(dailyLog?.notes ?? "");
  const [saved, setSaved] = useState(false);
  const clearNotesAfterSaveDate = useRef<string | null>(null);
  const selectedDateValue = useMemo(() => parseISO(date), [date]);
  const weekStrip = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(selectedDateValue, index - 3)), [selectedDateValue]);

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    setFlow(dailyLog?.flow ?? "none");
    setSymptoms(dailyLog?.symptoms ?? []);
    if (clearNotesAfterSaveDate.current === date) {
      clearNotesAfterSaveDate.current = null;
      setNotes("");
      return;
    }
    setNotes(dailyLog?.notes ?? "");
    setSaved(false);
  }, [dailyLog, date]);

  const changeDate = (amount: number) => {
    setDate(format(addDays(parseISO(date), amount), "yyyy-MM-dd"));
  };

  const saveLog = async () => {
    clearNotesAfterSaveDate.current = date;
    await upsertDailyLog(date, flow, symptoms, notes);
    Keyboard.dismiss();
    setNotes("");
    await refreshData();
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TopBar title="Daily Log" showBack onBackPress={onBackPress} onMenuPress={openMenu} />
        <View style={styles.headingBlock}>
          <Text style={[styles.title, { color: theme.ink }]}>Daily log</Text>
          <Text style={[styles.subtitle, { color: theme.accent }]}>Track flow, symptoms, and notes for any day.</Text>
        </View>

        <AnimatedEntrance index={0}>
          <Card style={[styles.dateCard, { backgroundColor: theme.petalSoft }]}>
            <View style={styles.dateHeader}>
              <Text style={[styles.dateLabel, { color: theme.inkSoft }]}>Selected date</Text>
              <View style={styles.dateNav}>
                <AnimatedPressable onPress={() => changeDate(-1)} style={styles.dateIconButton}>
                  <Ionicons name="chevron-back" size={18} color={theme.inkMuted} />
                </AnimatedPressable>
                <AnimatedPressable onPress={() => changeDate(1)} style={styles.dateIconButton}>
                  <Ionicons name="chevron-forward" size={18} color={theme.inkMuted} />
                </AnimatedPressable>
              </View>
            </View>
            <View style={styles.weekStrip}>
              {weekStrip.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const selected = dayKey === date;
                return (
                  <AnimatedPressable
                    key={dayKey}
                    onPress={() => setDate(dayKey)}
                    style={[
                      styles.weekDay,
                      { backgroundColor: theme.surface, borderColor: theme.line },
                      selected && { backgroundColor: theme.accent, borderColor: theme.accent }
                    ]}
                  >
                    <Text style={[styles.weekLabel, { color: selected ? theme.surface : theme.inkMuted }]}>{format(day, "EEE")}</Text>
                    <Text style={[styles.weekNumber, { color: selected ? theme.surface : theme.ink }]}>{format(day, "d")}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
            <Text style={[styles.dateText, { color: theme.accent }]}>{format(parseISO(date), "MMMM d, yyyy")}</Text>
          </Card>
        </AnimatedEntrance>

        <AnimatedEntrance index={1}>
          <Card style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.fieldLabel, { color: theme.ink }]}>Flow Intensity</Text>
              <Text style={[styles.statusBadge, { backgroundColor: theme.petal, color: theme.inkMuted }]}>{flow}</Text>
            </View>
            <FlowSelector
              value={flow}
              onChange={(nextFlow) => {
                setSaved(false);
                setFlow(nextFlow);
              }}
            />
          </Card>
        </AnimatedEntrance>

        <AnimatedEntrance index={2}>
          <View style={styles.symptomSection}>
            <SymptomChips
              selected={symptoms}
              onChange={(nextSymptoms) => {
                setSaved(false);
                setSymptoms(nextSymptoms);
              }}
            />
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={3}>
          <View style={styles.notesSection}>
            <Text style={[styles.fieldLabel, { color: theme.ink }]}>Daily Notes</Text>
            <View style={styles.notesWrap}>
            <TextInput
              multiline
              onChangeText={setNotes}
              onFocus={() => setSaved(false)}
              placeholder="Anything worth remembering? Energy, cravings, medication, thoughts..."
              placeholderTextColor={theme.inkMuted}
              style={[styles.notes, { backgroundColor: theme.petalSoft, borderColor: theme.line, color: theme.ink }]}
              value={notes}
            />
              <Text style={[styles.charCount, { color: theme.inkMuted }]}>{notes.length} chars</Text>
            </View>
            <PrimaryButton label={saved ? "Saved" : "Save Log Details"} onPress={saveLog} />
            {saved ? <Text style={[styles.savedText, { color: theme.accent }]}>Saved to your calendar.</Text> : null}
          </View>
        </AnimatedEntrance>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: 112
  },
  dateCard: {
    backgroundColor: "#FFFDF9",
    gap: spacing.md,
    padding: spacing.md
  },
  dateHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  dateIconButton: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 10,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  dateLabel: {
    color: colors.inkSoft,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  dateNav: {
    flexDirection: "row",
    gap: spacing.xs
  },
  dateText: {
    color: colors.berry,
    fontFamily: typography.serif,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
    textAlign: "center",
    textTransform: "uppercase"
  },
  fieldLabel: {
    color: colors.ink,
    fontFamily: typography.serif,
    fontSize: 18,
    fontWeight: "900",
  },
  formCard: {
    gap: spacing.md,
    padding: spacing.lg
  },
  headingBlock: {
    gap: 3
  },
  notes: {
    backgroundColor: "#FFFDF9",
    borderColor: colors.line,
    borderRadius: radii.xl,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    minHeight: 122,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    textAlignVertical: "top"
  },
  notesSection: {
    gap: spacing.sm
  },
  notesWrap: {
    position: "relative"
  },
  safeArea: {
    backgroundColor: colors.surface,
    flex: 1
  },
  savedText: {
    color: colors.berry,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
    textAlign: "center"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  statusBadge: {
    backgroundColor: colors.petal,
    borderRadius: 8,
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    textTransform: "capitalize"
  },
  charCount: {
    bottom: spacing.sm,
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "800",
    position: "absolute",
    right: spacing.md
  },
  symptomSection: {
    gap: spacing.md
  },
  subtitle: {
    color: colors.berry,
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  title: {
    color: colors.ink,
    fontFamily: typography.serif,
    fontSize: 34,
    fontWeight: "900"
  },
  weekDay: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 52,
    justifyContent: "center"
  },
  weekDayActive: {
    backgroundColor: colors.berry,
    borderColor: colors.berry
  },
  weekLabel: {
    color: colors.inkMuted,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  weekNumber: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3
  },
  weekStrip: {
    flexDirection: "row",
    gap: spacing.xs
  },
  weekTextActive: {
    color: colors.surface
  }
});
