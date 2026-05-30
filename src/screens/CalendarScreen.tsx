import { addMonths, format, parseISO } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedEntrance } from "../components/AnimatedEntrance";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { CalendarGrid } from "../components/CalendarGrid";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { TopBar } from "../components/TopBar";
import { addPeriodForDate, removePeriodForDate } from "../data/storage";
import { colors, spacing, typography, useTheme } from "../theme";
import { ScreenProps } from "../types";
import { motion, timingConfig } from "../utils/animation";
import {
  getAverageCycleLength,
  getAveragePeriodLength,
  getCyclePhaseDateKeys,
  getLogForDate,
  getPeriodDateKeys,
  getPredictedDateKeys
} from "../utils/cycle";

type Props = ScreenProps & {
  onBackPress: () => void;
  openMenu: () => void;
  openLogDate: (date: string) => void;
};

export function CalendarScreen({ data, refreshData, onBackPress, openMenu, openLogDate }: Props) {
  const theme = useTheme();
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const modalProgress = useSharedValue(0);
  const periodDates = useMemo(() => getPeriodDateKeys(data.cycles, data.settings), [data.cycles, data.settings]);
  const predictedDates = useMemo(() => getPredictedDateKeys(data.cycles, data.settings), [data.cycles, data.settings]);
  const phases = useMemo(() => getCyclePhaseDateKeys(data.cycles, data.settings), [data.cycles, data.settings]);
  const averageCycle = getAverageCycleLength(data.cycles, data.settings);
  const averagePeriod = getAveragePeriodLength(data.cycles, data.settings);
  const selectedLog = selectedDate ? getLogForDate(data.logs, selectedDate) : null;
  const selectedHasLog = Boolean(selectedLog && (selectedLog.flow !== "none" || selectedLog.symptoms.length > 0 || selectedLog.notes.trim().length > 0));
  const selectedIsLoggedPeriod = selectedDate ? periodDates.has(selectedDate) : false;
  const selectedStatuses = selectedDate
    ? [
        periodDates.has(selectedDate) ? "Logged period" : null,
        predictedDates.has(selectedDate) ? "Predicted period" : null,
        phases.follicularDates.has(selectedDate) ? "Follicular phase" : null,
        phases.fertileDates.has(selectedDate) ? "Fertile window" : null,
        phases.ovulationDates.has(selectedDate) ? "Ovulation estimate" : null,
        phases.lutealDates.has(selectedDate) ? "Luteal phase" : null
      ].filter(Boolean)
    : [];

  const openSelectedLog = () => {
    if (!selectedDate) {
      return;
    }

    closeModal(selectedDate);
  };

  const removeSelectedPeriod = async () => {
    if (!selectedDate || !selectedIsLoggedPeriod) {
      return;
    }

    await removePeriodForDate(selectedDate, data.settings.periodLength);
    await refreshData();
    closeModal();
  };

  const addSelectedPeriod = async () => {
    if (!selectedDate || selectedIsLoggedPeriod) {
      return;
    }

    await addPeriodForDate(selectedDate, data.settings.periodLength);
    await refreshData();
    closeModal();
  };

  const finishClose = (dateToOpen?: string) => {
    setSelectedDate(null);
    if (dateToOpen) {
      openLogDate(dateToOpen);
    }
  };

  const closeModal = (dateToOpen?: string) => {
    modalProgress.value = withTiming(0, timingConfig(motion.duration.fast, reduceMotion), () => {
      runOnJS(finishClose)(dateToOpen);
    });
  };

  useEffect(() => {
    if (selectedDate) {
      modalProgress.value = withTiming(1, timingConfig(motion.duration.base, reduceMotion));
    }
  }, [modalProgress, reduceMotion, selectedDate]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: modalProgress.value
  }));

  const modalCardStyle = useAnimatedStyle(() => ({
    opacity: modalProgress.value,
    transform: [{ scale: reduceMotion ? 1 : 0.96 + modalProgress.value * 0.04 }]
  }));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TopBar title="Calendar" showBack onBackPress={onBackPress} onMenuPress={openMenu} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.ink }]}>Monthly Forecast</Text>
        </View>
        <AnimatedEntrance index={0}>
          <Card style={styles.calendarCard}>
            <View style={styles.monthRow}>
              <AnimatedPressable onPress={() => setMonth(addMonths(month, -1))} style={styles.monthIconButton}>
                <Ionicons name="chevron-back" size={18} color={theme.inkMuted} />
              </AnimatedPressable>
              <Text style={[styles.month, { color: theme.ink }]}>{format(month, "MMMM yyyy")}</Text>
              <AnimatedPressable onPress={() => setMonth(addMonths(month, 1))} style={styles.monthIconButton}>
                <Ionicons name="chevron-forward" size={18} color={theme.inkMuted} />
              </AnimatedPressable>
            </View>
            <CalendarGrid
              month={month}
              periodDates={periodDates}
              predictedDates={predictedDates}
              follicularDates={phases.follicularDates}
              fertileDates={phases.fertileDates}
              ovulationDate={null}
              ovulationDates={phases.ovulationDates}
              lutealDates={phases.lutealDates}
              logs={data.logs}
              onSelectDate={setSelectedDate}
            />
          </Card>
        </AnimatedEntrance>
        <AnimatedEntrance index={1}>
          <Card style={[styles.legendCard, { backgroundColor: theme.petalSoft }]}>
            <Text style={[styles.legendTitle, { color: theme.inkMuted }]}>Calendar Guide</Text>
            <View style={styles.legendGrid}>
              <Legend color="#CC766F" label="Period" />
              <Legend color="#F3D481" label="Follicular" />
              <Legend color="#C7DFA7" label="Fertile" />
              <Legend color="#8DBE78" label="Ovulation" />
              <Legend color="#E4B68E" label="Luteal" />
              <Legend color="#E8C2CF" label="Predicted" />
              <Legend color={theme.secondary} label="Log" dot />
            </View>
          </Card>
        </AnimatedEntrance>
        <AnimatedEntrance index={2}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={[styles.statLabel, { color: theme.inkMuted }]}>Avg Cycle Length</Text>
              <Text style={[styles.statValue, { color: theme.ink }]}>{averageCycle} Days</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statLabel, { color: theme.inkMuted }]}>Avg Period Duration</Text>
              <Text style={[styles.statValue, { color: theme.ink }]}>{averagePeriod} Days</Text>
            </Card>
          </View>
        </AnimatedEntrance>
      </ScrollView>
      <Modal animationType="none" transparent visible={selectedDate !== null} onRequestClose={() => closeModal()}>
        <Animated.View style={[styles.modalBackdrop, backdropStyle]}>
          <Animated.View style={[styles.modalCard, { backgroundColor: theme.surface }, modalCardStyle]}>
            <Text style={[styles.modalDate, { color: theme.ink }]}>{selectedDate ? format(parseISO(selectedDate), "MMMM d, yyyy") : ""}</Text>
            {selectedStatuses.length > 0 ? (
              <View style={styles.statusWrap}>
                {selectedStatuses.map((status) => (
                  <Text key={status} style={[styles.statusPill, { backgroundColor: theme.accentSoft, color: theme.accent }]}>
                    {status}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: theme.inkMuted }]}>No cycle markers for this date.</Text>
            )}

            <View style={[styles.modalSection, { backgroundColor: theme.canvas }]}>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>Log details</Text>
              {selectedHasLog && selectedLog ? (
                <>
                  <Text style={[styles.logMeta, { color: theme.inkMuted }]}>{selectedLog.flow !== "none" ? `${selectedLog.flow} flow` : "Daily note"}</Text>
                  {selectedLog.symptoms.length > 0 ? <Text style={[styles.logNote, { color: theme.ink }]}>{selectedLog.symptoms.join(", ")}</Text> : null}
                  {selectedLog.notes.trim().length > 0 ? <Text style={[styles.logNote, { color: theme.ink }]}>{selectedLog.notes}</Text> : null}
                </>
              ) : (
                <Text style={[styles.emptyText, { color: theme.inkMuted }]}>No flow, symptoms, or notes saved yet.</Text>
              )}
            </View>

            <View style={styles.modalActionStack}>
              <View style={styles.modalActions}>
                <PrimaryButton label="Close" onPress={() => closeModal()} variant="outline" style={styles.modalButton} />
                <PrimaryButton label={selectedHasLog ? "Edit log" : "Add log"} onPress={openSelectedLog} style={styles.modalButton} />
              </View>
              {selectedIsLoggedPeriod ? (
                <PrimaryButton label="Remove this period" onPress={removeSelectedPeriod} variant="danger" />
              ) : (
                <PrimaryButton label="Add period from this date" onPress={addSelectedPeriod} variant="soft" />
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

function Legend({ color, label, dot = false }: { color: string; label: string; dot?: boolean }) {
  const theme = useTheme();

  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: dot ? theme.surface : color, borderColor: theme.line }]}>
        {dot ? <View style={[styles.innerDot, { backgroundColor: color }]} /> : null}
      </View>
      <Text style={[styles.legendText, { color: theme.inkMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: 112
  },
  calendarCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },
  emptyText: {
    color: colors.inkMuted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22
  },
  legendCard: {
    backgroundColor: "#FFFDF9",
    gap: spacing.sm
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.sm
  },
  legendTitle: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "900"
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    width: "50%"
  },
  legendText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "800"
  },
  month: {
    color: colors.ink,
    flex: 1,
    fontFamily: typography.serif,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center"
  },
  monthBadge: {
    backgroundColor: colors.berrySoft,
    borderRadius: 999,
    color: colors.berry,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  monthIconButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36
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
  modalActionStack: {
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm
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
    backgroundColor: colors.surface,
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
  innerDot: {
    borderRadius: 3,
    height: 6,
    width: 6
  },
  swatch: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    height: 14,
    justifyContent: "center",
    width: 14
  },
  statCard: {
    flex: 1,
    gap: spacing.xs
  },
  statLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  statValue: {
    color: colors.ink,
    fontFamily: typography.serif,
    fontSize: 24,
    fontWeight: "900"
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  title: {
    color: colors.ink,
    fontFamily: typography.serif,
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center"
  }
});
