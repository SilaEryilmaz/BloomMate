import { differenceInCalendarDays, parseISO } from "date-fns";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/Card";
import { colors, spacing } from "../theme";
import { ScreenProps } from "../types";
import { formatFriendlyDate, getAverageCycleLength, getAveragePeriodLength } from "../utils/cycle";

export function HistoryScreen({ data }: ScreenProps) {
  const averageCycle = getAverageCycleLength(data.cycles);
  const averagePeriod = getAveragePeriodLength(data.cycles);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>History</Text>
        <View style={styles.stats}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{averageCycle}</Text>
            <Text style={styles.statLabel}>day cycle</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{averagePeriod}</Text>
            <Text style={styles.statLabel}>day period</Text>
          </Card>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Past cycles</Text>
          {data.cycles.length === 0 ? (
            <Text style={styles.empty}>Your cycle history will appear here after your first period log.</Text>
          ) : (
            data.cycles.map((cycle) => {
              const periodLength = cycle.endDate ? differenceInCalendarDays(parseISO(cycle.endDate), parseISO(cycle.startDate)) + 1 : null;
              return (
                <View key={cycle.id} style={styles.cycleRow}>
                  <View>
                    <Text style={styles.cycleTitle}>
                      {formatFriendlyDate(cycle.startDate)}
                      {cycle.endDate ? ` - ${formatFriendlyDate(cycle.endDate)}` : " - in progress"}
                    </Text>
                    <Text style={styles.cycleMeta}>{periodLength ? `${periodLength} day period` : "Tracking now"}</Text>
                  </View>
                </View>
              );
            })
          )}
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
  cycleMeta: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3
  },
  cycleRow: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingVertical: spacing.md
  },
  cycleTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  empty: {
    color: colors.inkMuted,
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.sm
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: spacing.sm
  },
  statCard: {
    flex: 1
  },
  statLabel: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  statNumber: {
    color: colors.berry,
    fontSize: 34,
    fontWeight: "900"
  },
  stats: {
    flexDirection: "row",
    gap: spacing.sm
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "900"
  }
});
