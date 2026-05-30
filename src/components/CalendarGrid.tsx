import { addDays, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "./AnimatedPressable";
import { colors, radii, spacing, useTheme } from "../theme";
import { DailyLog } from "../types";
import { todayKey } from "../utils/cycle";

type Props = {
  month: Date;
  periodDates: Set<string>;
  predictedDates: Set<string>;
  follicularDates: Set<string>;
  fertileDates: Set<string>;
  ovulationDate: string | null;
  ovulationDates: Set<string>;
  lutealDates: Set<string>;
  logs: DailyLog[];
  onSelectDate: (date: string) => void;
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function CalendarGrid({
  month,
  periodDates,
  predictedDates,
  follicularDates,
  fertileDates,
  ovulationDate,
  ovulationDates,
  lutealDates,
  logs,
  onSelectDate
}: Props) {
  const theme = useTheme();
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const today = todayKey();
  const days: Date[] = [];
  let cursor = start;

  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.weekHeader}>
        {WEEKDAYS.map((day, index) => (
          <Text key={`${day}-${index}`} style={[styles.weekday, { color: theme.inkSoft }]}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const hasLog = logs.some((log) => log.date === key && (log.symptoms.length > 0 || log.flow !== "none" || log.notes.trim().length > 0));
          const isPeriod = periodDates.has(key);
          const isPredicted = predictedDates.has(key);
          const isFollicular = follicularDates.has(key);
          const isFertile = fertileDates.has(key);
          const isOvulation = ovulationDate === key || ovulationDates.has(key);
          const isLuteal = lutealDates.has(key);
          const isToday = key === today;
          const muted = !isSameMonth(day, month);

          return (
            <AnimatedPressable
              key={key}
              onPress={() => onSelectDate(key)}
              style={[
                styles.day,
                isFollicular && styles.follicular,
                isLuteal && styles.luteal,
                isPredicted && styles.predicted,
                isFertile && styles.fertile,
                isOvulation && styles.ovulation,
                isPeriod && styles.period,
                isToday && { borderColor: theme.ink, borderWidth: 2 },
                muted && styles.muted
              ]}
            >
              <Text style={[styles.dayText, { color: theme.ink }, isPeriod && styles.periodText, muted && { color: theme.inkMuted }]}>{format(day, "d")}</Text>
              {isToday ? <View style={[styles.todaySpark, { backgroundColor: theme.ink }]} /> : null}
              {isPredicted && !isPeriod ? <Text style={[styles.predictedMark, { color: theme.accent }]}>~</Text> : null}
              {isOvulation && !isPeriod ? <Text style={[styles.ovulationMark, { color: theme.accent }]}>*</Text> : null}
              {hasLog ? <View style={[styles.dot, isPeriod && styles.lightDot]} /> : null}
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  day: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "transparent",
    borderRadius: radii.md,
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
    width: "13.15%"
  },
  dayText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  dot: {
    backgroundColor: colors.coral,
    borderRadius: 3,
    bottom: 5,
    height: 6,
    position: "absolute",
    width: 6
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  fertile: {
    backgroundColor: "#C7DFA7"
  },
  follicular: {
    backgroundColor: "#F3D481"
  },
  lightDot: {
    backgroundColor: colors.surface
  },
  muted: {
    opacity: 0.32
  },
  mutedText: {
    color: colors.inkMuted
  },
  luteal: {
    backgroundColor: "#E4B68E"
  },
  period: {
    backgroundColor: "#CC766F",
    shadowColor: colors.berry,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 8
  },
  periodText: {
    color: colors.ink
  },
  todaySpark: {
    borderRadius: 2,
    height: 4,
    position: "absolute",
    right: 7,
    top: 7,
    width: 4
  },
  predicted: {
    backgroundColor: "#E8C2CF"
  },
  predictedMark: {
    color: colors.berry,
    fontSize: 11,
    fontWeight: "900",
    position: "absolute",
    right: 8,
    top: 5
  },
  ovulation: {
    backgroundColor: "#8DBE78"
  },
  ovulationMark: {
    color: colors.berry,
    fontSize: 14,
    fontWeight: "900",
    position: "absolute",
    right: 7,
    top: 4
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: spacing.md
  },
  weekday: {
    color: colors.inkSoft,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    width: "14.285%"
  },
  wrapper: {
    gap: spacing.xs
  }
});
