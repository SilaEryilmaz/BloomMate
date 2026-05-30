import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedEntrance } from "../components/AnimatedEntrance";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { TopBar } from "../components/TopBar";
import { endPeriod, startPeriod, updateDailyWaterCups } from "../data/storage";
import { colors, spacing, typography, useTheme } from "../theme";
import { DailyLog, ScreenProps } from "../types";
import {
  getCycleDay,
  getPeriodDateKeys,
  getLogForDate,
  getNextPeriodStart,
  todayKey
} from "../utils/cycle";
import { getDailyInsight } from "../utils/dailyInsight";
import { motion, timingConfig } from "../utils/animation";

type Props = ScreenProps & {
  openMenu: () => void;
};

const ML_PER_HYDRATION_UNIT = 250;
const WATER_BLUE = "#45A7E6";
const WATER_BLUE_DARK = "#1F7FBE";

export function TodayScreen({ data, refreshData, openMenu }: Props) {
  const theme = useTheme();
  const [selectedHistoryLog, setSelectedHistoryLog] = useState<DailyLog | null>(null);
  const [hiddenHistoryDates, setHiddenHistoryDates] = useState<Set<string>>(() => new Set());
  const today = todayKey();
  const todaysLog = useMemo(() => getLogForDate(data.logs, today), [data.logs, today]);
  const hydrationGoal = data.settings.hydrationGoal;
  const waterCups = Math.min(todaysLog?.waterCups ?? 0, hydrationGoal);
  const waterMl = waterCups * ML_PER_HYDRATION_UNIT;
  const hydrationGoalMl = hydrationGoal * ML_PER_HYDRATION_UNIT;
  const hydrationComplete = waterMl >= hydrationGoalMl && hydrationGoalMl > 0;
  const hydrationPercent = hydrationGoalMl > 0 ? Math.round((waterMl / hydrationGoalMl) * 100) : 0;
  const cycleDay = getCycleDay(data.cycles);
  const nextPeriod = getNextPeriodStart(data.cycles, data.settings);
  const rawDaysUntilPeriod = nextPeriod ? differenceInCalendarDays(parseISO(nextPeriod), new Date()) : null;
  const periodDates = useMemo(() => getPeriodDateKeys(data.cycles, data.settings), [data.cycles, data.settings]);
  const isPeriodToday = periodDates.has(today);
  const circleStatus = getForecastCircleStatus(isPeriodToday, cycleDay, rawDaysUntilPeriod);
  const dailyInsight = useMemo(() => getDailyInsight(data), [data]);
  const historyLogs = data.logs
    .filter((log) => log.flow !== "none" || log.symptoms.length > 0 || log.notes.trim().length > 0)
    .filter((log) => !hiddenHistoryDates.has(log.date));
  const recentLogs = historyLogs.slice(0, 4);

  const handleStart = async () => {
    await startPeriod(today, data.settings.periodLength);
    await refreshData();
  };

  const handleEnd = async () => {
    await endPeriod(today, data.settings.periodLength);
    await refreshData();
  };

  const updateHydration = async (nextCups: number) => {
    await updateDailyWaterCups(today, Math.min(hydrationGoal, Math.max(0, nextCups)));
    await refreshData();
  };

  const confirmClearHistory = () => {
    Alert.alert("Clear Home history?", "This only clears the history list on Home. Your saved logs will still appear in Calendar and Logs.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setHiddenHistoryDates((current) => {
            const next = new Set(current);
            historyLogs.forEach((log) => next.add(log.date));
            return next;
          });
          setSelectedHistoryLog(null);
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.canvas }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TopBar onMenuPress={openMenu} />

        <AnimatedEntrance index={0}>
          <Card style={[styles.insightPanel, { backgroundColor: theme.petal }]}>
            <View style={[styles.insightPill, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <Ionicons name="sparkles-outline" size={13} color={theme.accent} />
              <Text style={[styles.insightPillText, { color: theme.accent }]}>BloomMate Daily Insight</Text>
            </View>
            <View style={[styles.phasePill, { backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.phasePillText, { color: theme.accent }]}>{dailyInsight.label}</Text>
            </View>
            <Text style={[styles.insightHeadline, { color: theme.ink }]}>{dailyInsight.title}</Text>
            <Text style={[styles.insightCopy, { color: theme.inkMuted }]}>{dailyInsight.body}</Text>
          </Card>
        </AnimatedEntrance>

        <AnimatedEntrance index={1}>
          <Card style={[styles.forecastCard, { backgroundColor: circleStatus.cardColor }]}>
            <View style={[styles.circleOutline, { borderColor: circleStatus.ringColor }]}>
              <View style={[styles.circle, { backgroundColor: circleStatus.fillColor }]}>
                <Text style={[styles.circleSmall, { color: circleStatus.textColor }]}>{circleStatus.label}</Text>
                <Text style={[styles.circleNumber, { color: circleStatus.textColor }]}>{circleStatus.value}</Text>
                <Text style={[styles.circleSmall, { color: circleStatus.textColor }]}>{circleStatus.caption}</Text>
              </View>
            </View>
          </Card>
        </AnimatedEntrance>

        <AnimatedEntrance index={2}>
          <Card style={styles.hydrationCard}>
            <View style={styles.hydrationHeader}>
              <View>
                <Text style={[styles.historyTitle, { color: theme.ink }]}>Hydration Goal</Text>
                <Text style={[styles.historyMeta, { color: theme.inkMuted }]}>Helpful for comfort and steady energy.</Text>
              </View>
              <View style={[styles.waterBadge, { backgroundColor: hydrationComplete ? "#FFF0C7" : theme.accentSoft }]}>
                <Ionicons name={hydrationComplete ? "sparkles" : "water"} size={14} color={hydrationComplete ? "#B7791F" : theme.accent} />
                <Text style={[styles.waterBadgeText, { color: hydrationComplete ? "#8A5B13" : theme.accent }]}>
                  {hydrationComplete ? "Goal reached" : `${hydrationPercent}%`}
                </Text>
              </View>
            </View>
            <HydrationMeter
              goalMl={hydrationGoalMl}
              onChange={updateHydration}
              valueMl={waterMl}
            />
          </Card>
        </AnimatedEntrance>

        <AnimatedEntrance index={3} style={styles.buttonRow}>
          <PrimaryButton label="Start period" onPress={handleStart} style={styles.rowButton} />
          <PrimaryButton label="End period" onPress={handleEnd} variant="soft" style={styles.rowButton} />
        </AnimatedEntrance>

        {recentLogs.length > 0 ? (
          <AnimatedEntrance index={4} style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: theme.ink }]}>Logged History</Text>
              <AnimatedPressable
                onPress={confirmClearHistory}
                style={[styles.clearHistoryButton, { backgroundColor: theme.accentSoft }]}
              >
                <Text style={[styles.clearHistoryText, { color: theme.accent }]}>Clear history</Text>
              </AnimatedPressable>
            </View>
            {recentLogs.map((log) => (
              <AnimatedPressable key={log.date} onPress={() => setSelectedHistoryLog(log)}>
                <Card style={[styles.historyCard, { backgroundColor: theme.petalSoft }]}>
                  <View style={[styles.historyIcon, { backgroundColor: theme.petal }]}>
                    <Ionicons name="water" size={18} color={log.flow === "heavy" ? theme.accent : theme.secondary} />
                  </View>
                  <View style={styles.historyTextWrap}>
                    <Text style={[styles.historyDate, { color: theme.ink }]}>{format(parseISO(log.date), "MMM d, yyyy")}</Text>
                    <Text style={[styles.historyMeta, { color: theme.inkMuted }]} numberOfLines={1}>
                      {[...log.symptoms.slice(0, 2), log.flow !== "none" ? `${log.flow} flow` : null].filter(Boolean).join(" - ") || "Daily note"}
                    </Text>
                  </View>
                </Card>
              </AnimatedPressable>
            ))}
          </AnimatedEntrance>
        ) : null}

      </ScrollView>
      <Modal animationType="fade" transparent visible={selectedHistoryLog !== null} onRequestClose={() => setSelectedHistoryLog(null)}>
        <View style={styles.historyModalBackdrop}>
          <View style={[styles.historyModalCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.historyModalDate, { color: theme.ink }]}>
              {selectedHistoryLog ? format(parseISO(selectedHistoryLog.date), "MMMM d, yyyy") : ""}
            </Text>
            <View style={[styles.historyModalSection, { backgroundColor: theme.canvas }]}>
              <Text style={[styles.historyModalLabel, { color: theme.inkMuted }]}>Flow</Text>
              <Text style={[styles.historyModalValue, { color: theme.ink }]}>{selectedHistoryLog?.flow ?? "none"}</Text>
            </View>
            <View style={[styles.historyModalSection, { backgroundColor: theme.canvas }]}>
              <Text style={[styles.historyModalLabel, { color: theme.inkMuted }]}>Symptoms and mood</Text>
              <Text style={[styles.historyModalValue, { color: theme.ink }]}>
                {selectedHistoryLog && selectedHistoryLog.symptoms.length > 0 ? selectedHistoryLog.symptoms.join(", ") : "None saved"}
              </Text>
            </View>
            <View style={[styles.historyModalSection, { backgroundColor: theme.canvas }]}>
              <Text style={[styles.historyModalLabel, { color: theme.inkMuted }]}>Notes</Text>
              <Text style={[styles.historyModalValue, { color: theme.ink }]}>
                {selectedHistoryLog?.notes.trim() ? selectedHistoryLog.notes : "No note saved"}
              </Text>
            </View>
            <PrimaryButton label="Close" onPress={() => setSelectedHistoryLog(null)} variant="outline" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function HydrationMeter({
  goalMl,
  onChange,
  valueMl
}: {
  goalMl: number;
  onChange: (cups: number) => void;
  valueMl: number;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const ripple = useSharedValue(0);
  const flow = useSharedValue(0);
  const currentCups = valueMl / ML_PER_HYDRATION_UNIT;
  const progress = goalMl > 0 ? Math.min(1, Math.max(0, valueMl / goalMl)) : 0;
  const complete = progress >= 1;

  useEffect(() => {
    if (reduceMotion) {
      flow.value = 0;
      return;
    }

    flow.value = withRepeat(withTiming(1, timingConfig(2800, false)), -1, false);
    return () => cancelAnimation(flow);
  }, [flow, reduceMotion]);

  useEffect(() => {
    ripple.value = reduceMotion
      ? 0
      : withSequence(
          withTiming(1, timingConfig(motion.duration.fast, reduceMotion)),
          withTiming(0, timingConfig(motion.duration.base, reduceMotion))
        );
  }, [reduceMotion, ripple, valueMl]);

  const bubbleOneStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + ripple.value * 0.45,
    transform: [{ translateY: -ripple.value * 18 - flow.value * 3 }, { scale: 0.9 + ripple.value * 0.32 }]
  }));
  const bubbleTwoStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + ripple.value * 0.4,
    transform: [{ translateY: -ripple.value * 13 + flow.value * 2 }, { scale: 0.95 + ripple.value * 0.26 }]
  }));
  const bubbleThreeStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + ripple.value * 0.55,
    transform: [{ translateY: -ripple.value * 24 }, { translateX: ripple.value * 9 }, { scale: 0.75 + ripple.value * 0.48 }]
  }));
  const splashStyle = useAnimatedStyle(() => ({
    opacity: ripple.value * 0.7,
    transform: [{ translateY: -ripple.value * 5 }, { scaleX: 0.45 + ripple.value * 0.85 }, { scaleY: 0.62 + ripple.value * 0.48 }]
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ripple.value * 0.08 }]
  }));
  const waveOneStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -120 + flow.value * 120 }, { translateY: Math.sin(flow.value * Math.PI * 2) * 3 }]
  }));
  const waveTwoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -20 - flow.value * 90 }, { translateY: Math.cos(flow.value * Math.PI * 2) * 2.5 }]
  }));
  const highlightStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + ripple.value * 0.22,
    transform: [{ translateX: -18 + flow.value * 26 }]
  }));

  return (
    <View style={styles.hydrationMeterWrap}>
      <View style={[styles.hydrationTrack, { backgroundColor: "#EAF7FF", borderColor: "#CFEAFB" }]}>
        <View style={[styles.hydrationFill, { backgroundColor: WATER_BLUE, width: `${progress * 100}%` }]}>
          <Animated.View style={[styles.waterHighlight, highlightStyle]} />
          <Animated.View style={[styles.waveOne, waveOneStyle]} />
          <Animated.View style={[styles.waveTwo, waveTwoStyle]} />
          <Animated.View style={[styles.waterSplash, splashStyle]} />
          <Animated.View style={[styles.waterBubble, styles.waterBubbleOne, bubbleOneStyle]} />
          <Animated.View style={[styles.waterBubble, styles.waterBubbleTwo, bubbleTwoStyle]} />
          <Animated.View style={[styles.waterBubble, styles.waterBubbleThree, bubbleThreeStyle]} />
        </View>
        <Animated.View style={[styles.hydrationThumb, { backgroundColor: complete ? "#FFF0C7" : theme.surface, borderColor: complete ? "#E7B84A" : WATER_BLUE }, thumbStyle]}>
          <Ionicons name={complete ? "sparkles" : "water"} size={18} color={complete ? "#B7791F" : WATER_BLUE_DARK} />
        </Animated.View>
      </View>
      <View style={styles.hydrationControls}>
        <AnimatedPressable
          onPress={() => onChange(currentCups - 1)}
          style={[styles.hydrationStepButton, { backgroundColor: theme.surface, borderColor: "#CFEAFB" }]}
        >
          <Ionicons name="remove" size={20} color={WATER_BLUE_DARK} />
          <Text style={[styles.hydrationStepText, { color: WATER_BLUE_DARK }]}>250 ml</Text>
        </AnimatedPressable>
        <Text style={[styles.hydrationHint, { color: theme.inkMuted }]}>{valueMl} of {goalMl} ml</Text>
        <AnimatedPressable
          onPress={() => onChange(currentCups + 1)}
          style={[styles.hydrationStepButton, { backgroundColor: "#EAF7FF", borderColor: "#CFEAFB" }]}
        >
          <Ionicons name="add" size={20} color={WATER_BLUE_DARK} />
          <Text style={[styles.hydrationStepText, { color: WATER_BLUE_DARK }]}>250 ml</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function getForecastCircleStatus(isPeriodToday: boolean, cycleDay: number | null, daysUntilPeriod: number | null) {
  if (isPeriodToday) {
    return {
      caption: "Current period",
      cardColor: "#FCEBE8",
      fillColor: "#CC766F",
      label: "Period day",
      ringColor: "#F1BBB5",
      textColor: colors.surface,
      value: cycleDay ? String(cycleDay) : "1"
    };
  }

  if (daysUntilPeriod === null) {
    return {
      caption: "Log a period to begin",
      cardColor: "#FFFDF9",
      fillColor: colors.surface,
      label: "Forecast",
      ringColor: "#F7F3EE",
      textColor: colors.ink,
      value: "..."
    };
  }

  if (daysUntilPeriod < 0) {
    const daysLate = Math.abs(daysUntilPeriod);
    return {
      caption: daysLate === 1 ? "Day late" : "Days late",
      cardColor: "#F8E6EE",
      fillColor: colors.berry,
      label: "Period late by",
      ringColor: "#E8AFC4",
      textColor: colors.surface,
      value: String(daysLate)
    };
  }

  return {
    caption: daysUntilPeriod === 1 ? "Day (Approx.)" : "Days (Approx.)",
    cardColor: "#FFF4E8",
    fillColor: "#F3D481",
    label: "Period in",
    ringColor: "#F7E1A9",
    textColor: colors.ink,
    value: String(daysUntilPeriod)
  };
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
    backgroundColor: colors.surface,
    borderRadius: 92,
    height: 150,
    justifyContent: "center",
    width: 150
  },
  circleNumber: {
    color: colors.ink,
    fontSize: 38,
    fontWeight: "900"
  },
  circleOutline: {
    alignItems: "center",
    borderColor: "#F7F3EE",
    borderRadius: 90,
    borderWidth: 9,
    height: 180,
    justifyContent: "center",
    width: 180
  },
  circleSmall: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  clearHistoryButton: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  clearHistoryText: {
    fontSize: 12,
    fontWeight: "900"
  },
  forecastCard: {
    alignItems: "center",
    gap: spacing.md
  },
  greeting: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800"
  },
  cardLabel: {
    color: colors.berry,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  content: {
    gap: spacing.lg,
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: 112
  },
  historyCard: {
    alignItems: "center",
    backgroundColor: "#FFFDF9",
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  historyDate: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  historyIcon: {
    alignItems: "center",
    backgroundColor: colors.petal,
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  historyHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  historyMeta: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  historyModalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(45, 34, 48, 0.38)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  historyModalCard: {
    borderRadius: 26,
    gap: spacing.md,
    maxWidth: 430,
    padding: spacing.lg,
    width: "100%"
  },
  historyModalDate: {
    fontFamily: typography.serif,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center"
  },
  historyModalLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  historyModalSection: {
    borderRadius: 18,
    gap: 4,
    padding: spacing.md
  },
  historyModalValue: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22
  },
  historySection: {
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  historyTextWrap: {
    flex: 1
  },
  historyTitle: {
    color: colors.ink,
    fontFamily: typography.serif,
    fontSize: 17,
    fontWeight: "900"
  },
  insightCopy: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  },
  insightHeadline: {
    color: colors.ink,
    fontFamily: typography.serif,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: spacing.xs
  },
  insightPanel: {
    backgroundColor: colors.petal,
    padding: spacing.lg
  },
  insightPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5
  },
  insightPillText: {
    color: colors.berry,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  phasePill: {
    alignSelf: "flex-start",
    backgroundColor: colors.berrySoft,
    borderRadius: 999,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5
  },
  phasePillText: {
    color: colors.berry,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
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
  rowButton: {
    flex: 1
  },
  safeArea: {
    backgroundColor: colors.surface,
    flex: 1
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
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
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
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
    fontSize: 19,
    fontWeight: "900",
    marginTop: spacing.xs,
    textTransform: "capitalize"
  },
  insightRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  insightsTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: spacing.xs
  },
  title: {
    color: colors.ink,
    fontFamily: typography.serif,
    fontSize: 38,
    fontWeight: "900"
  },
  hydrationCard: {
    gap: spacing.md
  },
  hydrationHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  waterBadge: {
    alignItems: "center",
    backgroundColor: colors.berrySoft,
    borderRadius: 10,
    flexDirection: "row",
    gap: 4,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  waterBadgeText: {
    color: colors.berry,
    fontSize: 13,
    fontWeight: "900"
  },
  hydrationFill: {
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    top: 0
  },
  hydrationHint: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  hydrationControls: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  hydrationMeterWrap: {
    gap: spacing.sm
  },
  hydrationStepButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 94,
    paddingHorizontal: spacing.sm
  },
  hydrationStepText: {
    color: colors.berry,
    fontSize: 12,
    fontWeight: "900"
  },
  hydrationThumb: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 2,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    top: 5,
    width: 44
  },
  hydrationTrack: {
    backgroundColor: colors.petalSoft,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 56,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  waterBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    borderColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1,
    position: "absolute"
  },
  waterBubbleOne: {
    borderRadius: 5,
    height: 10,
    left: "28%",
    top: 13,
    width: 10
  },
  waterBubbleTwo: {
    borderRadius: 7,
    height: 14,
    right: 18,
    top: 27,
    width: 14
  },
  waterBubbleThree: {
    borderRadius: 4,
    height: 8,
    left: "58%",
    top: 33,
    width: 8
  },
  waterHighlight: {
    backgroundColor: "rgba(255, 255, 255, 0.26)",
    borderRadius: 999,
    height: 16,
    left: 12,
    position: "absolute",
    right: 12,
    top: 7
  },
  waterSplash: {
    backgroundColor: "rgba(255, 255, 255, 0.32)",
    borderRadius: 999,
    height: 34,
    position: "absolute",
    right: -12,
    top: 10,
    width: 58
  },
  waveOne: {
    backgroundColor: "rgba(255, 255, 255, 0.38)",
    borderRadius: 999,
    height: 34,
    left: 0,
    position: "absolute",
    top: -16,
    width: 240
  },
  waveTwo: {
    backgroundColor: "rgba(20, 120, 190, 0.22)",
    borderRadius: 999,
    bottom: -14,
    height: 34,
    left: 0,
    position: "absolute",
    width: 230
  },
});
