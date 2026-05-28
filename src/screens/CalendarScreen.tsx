import { addMonths, format } from "date-fns";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalendarGrid } from "../components/CalendarGrid";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, spacing } from "../theme";
import { ScreenProps } from "../types";
import { formatFriendlyDate, getNextPeriodStart, getPeriodDateKeys, getPredictedDateKeys } from "../utils/cycle";

export function CalendarScreen({ data }: ScreenProps) {
  const [month, setMonth] = useState(new Date());
  const periodDates = useMemo(() => getPeriodDateKeys(data.cycles, data.settings), [data.cycles, data.settings]);
  const predictedDates = useMemo(() => getPredictedDateKeys(data.cycles, data.settings), [data.cycles, data.settings]);
  const nextPeriod = getNextPeriodStart(data.cycles, data.settings);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Calendar</Text>
            <Text style={styles.subtitle}>{nextPeriod ? `Next bloom: ${formatFriendlyDate(nextPeriod)}` : "Predictions will appear after setup."}</Text>
          </View>
        </View>
        <Card style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <PrimaryButton label="<" variant="outline" onPress={() => setMonth(addMonths(month, -1))} style={styles.monthButton} />
            <Text style={styles.month}>{format(month, "MMMM yyyy")}</Text>
            <PrimaryButton label=">" variant="outline" onPress={() => setMonth(addMonths(month, 1))} style={styles.monthButton} />
          </View>
          <CalendarGrid month={month} periodDates={periodDates} predictedDates={predictedDates} logs={data.logs} />
        </Card>
        <Card style={styles.legendCard}>
          <Legend color={colors.coral} label="Logged period" />
          <Legend color={colors.butter} label="Prediction" />
          <Legend color={colors.berry} label="Daily log" />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: 112
  },
  calendarCard: {
    backgroundColor: "#FFFDF9",
    paddingBottom: spacing.lg
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  legendCard: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "center"
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  legendText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "800"
  },
  month: {
    color: colors.ink,
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  monthButton: {
    minHeight: 42,
    width: 52
  },
  monthRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.md
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  subtitle: {
    color: colors.berry,
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  swatch: {
    borderRadius: 7,
    height: 14,
    width: 14
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "900"
  }
});
