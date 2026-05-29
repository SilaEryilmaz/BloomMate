import { addDays, differenceInCalendarDays, format, startOfWeek, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/Card";
import { FlowSelector } from "../components/FlowSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { SymptomChips } from "../components/SymptomChips";
import { TopBar } from "../components/TopBar";
import { endPeriod, startPeriod, upsertDailyLog } from "../data/storage";
import { colors, spacing } from "../theme";
import { FlowLevel, ScreenProps } from "../types";
import { formatFriendlyDate, getCycleDay, getLogForDate, getNextPeriodStart, todayKey } from "../utils/cycle";

export function TodayScreen({ data, refreshData }: ScreenProps) {
  const today = todayKey();
  const todaysLog = useMemo(() => getLogForDate(data.logs, today), [data.logs, today]);
  const [flow, setFlow] = useState<FlowLevel>(todaysLog?.flow ?? "none");
  const [symptoms, setSymptoms] = useState<string[]>(todaysLog?.symptoms ?? []);
  const [notes, setNotes] = useState(todaysLog?.notes ?? "");
  const [saved, setSaved] = useState(false);

  const cycleDay = getCycleDay(data.cycles);
  const nextPeriod = getNextPeriodStart(data.cycles, data.settings);
  const daysUntilPeriod = nextPeriod ? Math.max(0, differenceInCalendarDays(parseISO(nextPeriod), new Date())) : null;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  useEffect(() => {
    setFlow(todaysLog?.flow ?? "none");
    setSymptoms(todaysLog?.symptoms ?? []);
    setNotes(todaysLog?.notes ?? "");
  }, [todaysLog]);

  const saveLog = async () => {
    await upsertDailyLog(today, flow, symptoms, notes);
    await refreshData();
    Keyboard.dismiss();
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleStart = async () => {
    await startPeriod(today);
    await refreshData();
  };

  const handleEnd = async () => {
    await endPeriod(today);
    await refreshData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TopBar />

        <Text style={styles.greeting}>Good Morning!</Text>

        <View style={styles.weekStrip}>
          {weekDays.map((day) => {
            const selected = format(day, "yyyy-MM-dd") === today;
            return (
              <View key={day.toISOString()} style={[styles.weekDay, selected && styles.weekDayActive]}>
                <Text style={[styles.weekLetter, selected && styles.weekTextActive]}>{format(day, "EEEEE")}</Text>
                <Text style={[styles.weekNumber, selected && styles.weekTextActive]}>{format(day, "d")}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.circleWrap}>
          <View style={styles.circleOutline}>
            <View style={styles.circle}>
              <Text style={styles.circleSmall}>{daysUntilPeriod === null ? "Your cycle is ready" : "Your period starts in"}</Text>
              <Text style={styles.circleNumber}>{daysUntilPeriod === null ? "..." : daysUntilPeriod}</Text>
              <View style={styles.circleDivider} />
              <Text style={styles.circleSmall}>{daysUntilPeriod === null ? "Log anytime" : daysUntilPeriod === 1 ? "day" : "days"}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.insightsTitle}>Your daily insights</Text>
        <View style={styles.insightRow}>
          <View style={[styles.insightCard, styles.insightCoral]}>
            <Text style={styles.insightLabel}>Cycle day</Text>
            <Text style={styles.insightNumber}>{cycleDay ?? "-"}</Text>
          </View>
          <View style={[styles.insightCard, styles.insightBlue]}>
            <Text style={styles.insightLabel}>Next</Text>
            <Text style={styles.insightNumber}>{nextPeriod ? formatFriendlyDate(nextPeriod) : "--"}</Text>
          </View>
          <View style={styles.insightCardSoft}>
            <Text style={styles.insightLabelDark}>Symptoms</Text>
            <Text style={styles.insightNumberDark}>{symptoms.length}</Text>
          </View>
          <View style={[styles.insightCard, styles.insightGold]}>
            <Text style={styles.insightLabel}>Flow</Text>
            <Text style={styles.insightNumber}>{flow}</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <PrimaryButton label="Start period" onPress={handleStart} style={styles.rowButton} />
          <PrimaryButton label="End period" onPress={handleEnd} variant="soft" style={styles.rowButton} />
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Today's log</Text>
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
          {saved ? <Text style={styles.savedText}>Saved to your calendar for today.</Text> : null}
          <PrimaryButton label={saved ? "Saved" : "Save today's log"} onPress={saveLog} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bigNumber: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900",
    marginTop: spacing.xs
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  circle: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 92,
    height: 184,
    justifyContent: "center",
    width: 184
  },
  circleDivider: {
    backgroundColor: colors.surface,
    height: 2,
    marginVertical: 8,
    opacity: 0.8,
    width: 58
  },
  circleNumber: {
    color: colors.surface,
    fontSize: 38,
    fontWeight: "900"
  },
  circleOutline: {
    alignItems: "center",
    borderColor: colors.coral,
    borderRadius: 110,
    borderStyle: "dotted",
    borderWidth: 2,
    height: 220,
    justifyContent: "center",
    width: 220
  },
  circleSmall: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  circleWrap: {
    alignItems: "center",
    marginVertical: spacing.sm
  },
  cardLabel: {
    color: colors.berry,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  content: {
    gap: spacing.md,
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: 112
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: spacing.sm,
    marginTop: spacing.md
  },
  greeting: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800"
  },
  kicker: {
    color: colors.berry,
    fontSize: 13,
    fontWeight: "900"
  },
  muted: {
    color: colors.inkMuted,
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  notes: {
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 92,
    padding: spacing.md,
    textAlignVertical: "top"
  },
  rowButton: {
    flex: 1
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  savedText: {
    color: colors.berry,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textAlign: "center"
  },
  insightBlue: {
    backgroundColor: colors.sky
  },
  insightCard: {
    borderRadius: 8,
    flex: 1,
    minHeight: 82,
    padding: spacing.sm
  },
  insightCardSoft: {
    backgroundColor: "#F5F2EF",
    borderRadius: 8,
    flex: 1,
    minHeight: 82,
    padding: spacing.sm
  },
  insightCoral: {
    backgroundColor: colors.coral
  },
  insightGold: {
    backgroundColor: colors.butter
  },
  insightLabel: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "800"
  },
  insightLabelDark: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800"
  },
  insightNumber: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: "900",
    marginTop: spacing.xs,
    textTransform: "capitalize"
  },
  insightNumberDark: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    marginTop: spacing.xs
  },
  insightRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  insightsTitle: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    paddingBottom: spacing.sm,
    textAlign: "center"
  },
  title: {
    color: colors.ink,
    fontSize: 38,
    fontWeight: "900"
  },
  weekDay: {
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 11,
    paddingVertical: 10
  },
  weekDayActive: {
    backgroundColor: colors.butter
  },
  weekLetter: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  weekNumber: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4
  },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  weekTextActive: {
    color: colors.surface
  }
});
