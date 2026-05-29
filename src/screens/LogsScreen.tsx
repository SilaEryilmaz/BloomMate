import { addDays, format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/Card";
import { FlowSelector } from "../components/FlowSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { SymptomChips } from "../components/SymptomChips";
import { TopBar } from "../components/TopBar";
import { upsertDailyLog } from "../data/storage";
import { colors, spacing } from "../theme";
import { FlowLevel, ScreenProps } from "../types";
import { formatFriendlyDate, getLogForDate, todayKey } from "../utils/cycle";

type Props = ScreenProps & {
  openMenu: () => void;
  selectedDate: string | null;
};

export function LogsScreen({ data, refreshData, selectedDate, openMenu }: Props) {
  const [date, setDate] = useState(selectedDate ?? todayKey());
  const dailyLog = useMemo(() => getLogForDate(data.logs, date), [data.logs, date]);
  const [flow, setFlow] = useState<FlowLevel>(dailyLog?.flow ?? "none");
  const [symptoms, setSymptoms] = useState<string[]>(dailyLog?.symptoms ?? []);
  const [notes, setNotes] = useState(dailyLog?.notes ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    setFlow(dailyLog?.flow ?? "none");
    setSymptoms(dailyLog?.symptoms ?? []);
    setNotes(dailyLog?.notes ?? "");
    setSaved(false);
  }, [dailyLog, date]);

  const changeDate = (amount: number) => {
    setDate(format(addDays(parseISO(date), amount), "yyyy-MM-dd"));
  };

  const saveLog = async () => {
    await upsertDailyLog(date, flow, symptoms, notes);
    await refreshData();
    Keyboard.dismiss();
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TopBar title="Log" showBack onMenuPress={openMenu} />
        <View>
          <Text style={styles.title}>Daily log</Text>
          <Text style={styles.subtitle}>Track flow, symptoms, and notes for any day.</Text>
        </View>

        <Card style={styles.dateCard}>
          <PrimaryButton label="<" onPress={() => changeDate(-1)} variant="outline" style={styles.dateButton} />
          <View style={styles.dateTextWrap}>
            <Text style={styles.dateLabel}>Selected date</Text>
            <Text style={styles.dateText}>{formatFriendlyDate(date)}</Text>
          </View>
          <PrimaryButton label=">" onPress={() => changeDate(1)} variant="outline" style={styles.dateButton} />
        </Card>

        <Card>
          <Text style={styles.fieldLabel}>Flow</Text>
          <FlowSelector value={flow} onChange={setFlow} />
          <Text style={styles.fieldLabel}>Symptoms and mood</Text>
          <SymptomChips selected={symptoms} onChange={setSymptoms} />
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            multiline
            onChangeText={setNotes}
            onFocus={() => setSaved(false)}
            placeholder="Anything worth remembering?"
            placeholderTextColor={colors.inkMuted}
            style={styles.notes}
            value={notes}
          />
          {saved ? <Text style={styles.savedText}>Saved to your calendar.</Text> : null}
          <PrimaryButton label={saved ? "Saved" : "Save log"} onPress={saveLog} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: 112
  },
  dateButton: {
    minHeight: 44,
    width: 52
  },
  dateCard: {
    alignItems: "center",
    backgroundColor: "#FFFDF9",
    flexDirection: "row",
    gap: spacing.sm
  },
  dateLabel: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  dateText: {
    color: colors.berry,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2
  },
  dateTextWrap: {
    alignItems: "center",
    flex: 1
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: spacing.sm,
    marginTop: spacing.md
  },
  notes: {
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 108,
    padding: spacing.md,
    textAlignVertical: "top"
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  savedText: {
    color: colors.berry,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textAlign: "center"
  },
  subtitle: {
    color: colors.berry,
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "900"
  }
});
