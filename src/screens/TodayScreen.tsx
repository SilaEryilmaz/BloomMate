import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/Card";
import { FlowSelector } from "../components/FlowSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { SymptomChips } from "../components/SymptomChips";
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

  const cycleDay = getCycleDay(data.cycles);
  const nextPeriod = getNextPeriodStart(data.cycles, data.settings);

  useEffect(() => {
    setFlow(todaysLog?.flow ?? "none");
    setSymptoms(todaysLog?.symptoms ?? []);
    setNotes(todaysLog?.notes ?? "");
  }, [todaysLog]);

  const saveLog = async () => {
    await upsertDailyLog(today, flow, symptoms, notes);
    await refreshData();
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
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>{format(new Date(), "EEEE, MMM d")}</Text>
            <Text style={styles.title}>Bloom</Text>
          </View>
          <Image source={require("../../assets/bloom-mascot.png")} style={styles.headerImage} />
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.sparkle} />
            <Text style={styles.cardLabel}>Current cycle</Text>
          </View>
          <Text style={styles.bigNumber}>{cycleDay ? `Day ${cycleDay}` : "Ready when you are"}</Text>
          <Text style={styles.muted}>
            {nextPeriod ? `Next period around ${formatFriendlyDate(nextPeriod)}` : "Your first setup is ready. Log a period anytime."}
          </Text>
          <View style={styles.buttonRow}>
            <PrimaryButton label="Start period" onPress={handleStart} style={styles.rowButton} />
            <PrimaryButton label="End period" onPress={handleEnd} variant="soft" style={styles.rowButton} />
          </View>
        </Card>

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
            placeholder="Anything worth remembering?"
            placeholderTextColor={colors.inkMuted}
            style={styles.notes}
            value={notes}
          />
          <PrimaryButton label="Save today's log" onPress={saveLog} />
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm
  },
  headerImage: {
    borderRadius: 24,
    height: 72,
    width: 72
  },
  heroCard: {
    backgroundColor: "#FFE9D9",
    overflow: "hidden"
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
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
  sparkle: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    height: 24,
    width: 24
  },
  title: {
    color: colors.ink,
    fontSize: 38,
    fontWeight: "900"
  }
});
