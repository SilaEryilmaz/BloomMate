import { addMonths, format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalendarGrid } from "../components/CalendarGrid";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { TopBar } from "../components/TopBar";
import { colors, spacing } from "../theme";
import { ScreenProps } from "../types";
import { formatFriendlyDate, getFertilityDateKeys, getLogForDate, getNextPeriodStart, getPeriodDateKeys, getPredictedDateKeys } from "../utils/cycle";

type Props = ScreenProps & {
  openMenu: () => void;
  openLogDate: (date: string) => void;
};

export function CalendarScreen({ data, openMenu, openLogDate }: Props) {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const periodDates = useMemo(() => getPeriodDateKeys(data.cycles, data.settings), [data.cycles, data.settings]);
  const predictedDates = useMemo(() => getPredictedDateKeys(data.cycles, data.settings), [data.cycles, data.settings]);
  const fertility = useMemo(() => getFertilityDateKeys(data.cycles, data.settings), [data.cycles, data.settings]);
  const nextPeriod = getNextPeriodStart(data.cycles, data.settings);
  const selectedLog = selectedDate ? getLogForDate(data.logs, selectedDate) : null;
  const selectedHasLog = Boolean(selectedLog && (selectedLog.flow !== "none" || selectedLog.symptoms.length > 0 || selectedLog.notes.trim().length > 0));
  const selectedStatuses = selectedDate
    ? [
        periodDates.has(selectedDate) ? "Logged period" : null,
        predictedDates.has(selectedDate) ? "Predicted period" : null,
        fertility.fertileDates.has(selectedDate) ? "Fertile window" : null,
        fertility.ovulationDate === selectedDate ? "Ovulation estimate" : null
      ].filter(Boolean)
    : [];

  const openSelectedLog = () => {
    if (!selectedDate) {
      return;
    }

    setSelectedDate(null);
    openLogDate(selectedDate);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <TopBar title="Calendar" showBack onMenuPress={openMenu} />
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cycle calendar</Text>
            <Text style={styles.subtitle}>{nextPeriod ? `Next period: ${formatFriendlyDate(nextPeriod)}` : "Predictions will appear after setup."}</Text>
          </View>
        </View>
        <Card style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <PrimaryButton label="<" variant="outline" onPress={() => setMonth(addMonths(month, -1))} style={styles.monthButton} />
            <Text style={styles.month}>{format(month, "MMMM yyyy")}</Text>
            <PrimaryButton label=">" variant="outline" onPress={() => setMonth(addMonths(month, 1))} style={styles.monthButton} />
          </View>
          <CalendarGrid
            month={month}
            periodDates={periodDates}
            predictedDates={predictedDates}
            fertileDates={fertility.fertileDates}
            ovulationDate={fertility.ovulationDate}
            logs={data.logs}
            onSelectDate={setSelectedDate}
          />
        </Card>
        <Card style={styles.legendCard}>
          <Legend color={colors.coral} label="Logged period" />
          <Legend color={colors.butter} label="Prediction" />
          <Legend color="#E7F4FB" label="Fertile window" />
          <Legend color={colors.sky} label="Ovulation estimate" />
          <Legend color={colors.berry} label="Daily log" />
        </Card>
        <Card style={styles.fertilityCard}>
          <Text style={styles.sectionTitle}>Fertility estimate</Text>
          <Text style={styles.emptyText}>
            BloomMate estimates ovulation around {fertility.ovulationDate ? formatFriendlyDate(fertility.ovulationDate) : "your next cycle"} and marks the fertile
            window around it. This is a prediction, not medical advice.
          </Text>
        </Card>
      </ScrollView>
      <Modal animationType="fade" transparent visible={selectedDate !== null} onRequestClose={() => setSelectedDate(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalDate}>{selectedDate ? format(parseISO(selectedDate), "MMMM d, yyyy") : ""}</Text>
            {selectedStatuses.length > 0 ? (
              <View style={styles.statusWrap}>
                {selectedStatuses.map((status) => (
                  <Text key={status} style={styles.statusPill}>
                    {status}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No cycle markers for this date.</Text>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Log details</Text>
              {selectedHasLog && selectedLog ? (
                <>
                  <Text style={styles.logMeta}>{selectedLog.flow !== "none" ? `${selectedLog.flow} flow` : "Daily note"}</Text>
                  {selectedLog.symptoms.length > 0 ? <Text style={styles.logNote}>{selectedLog.symptoms.join(", ")}</Text> : null}
                  {selectedLog.notes.trim().length > 0 ? <Text style={styles.logNote}>{selectedLog.notes}</Text> : null}
                </>
              ) : (
                <Text style={styles.emptyText}>No flow, symptoms, or notes saved yet.</Text>
              )}
            </View>

            <View style={styles.modalActions}>
              <PrimaryButton label="Close" onPress={() => setSelectedDate(null)} variant="outline" style={styles.modalButton} />
              <PrimaryButton label={selectedHasLog ? "Edit log" : "Add log"} onPress={openSelectedLog} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
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
  fertilityCard: {
    backgroundColor: "#F5FBFF"
  },
  emptyText: {
    color: colors.inkMuted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22
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
  logMeta: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  logNote: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    marginTop: 4
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(45, 34, 48, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  modalButton: {
    flex: 1
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.lg,
    width: "100%"
  },
  modalDate: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: spacing.md,
    textAlign: "center"
  },
  modalSection: {
    backgroundColor: colors.canvas,
    borderRadius: 14,
    marginTop: spacing.md,
    padding: spacing.md
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: spacing.sm
  },
  statusPill: {
    backgroundColor: "#F5F2EF",
    borderRadius: 999,
    color: colors.berry,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  statusWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center"
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
