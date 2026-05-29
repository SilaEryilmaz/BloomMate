import { addDays, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../theme";
import { DailyLog } from "../types";

type Props = {
  month: Date;
  periodDates: Set<string>;
  predictedDates: Set<string>;
  fertileDates: Set<string>;
  ovulationDate: string | null;
  logs: DailyLog[];
  onSelectDate: (date: string) => void;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarGrid({ month, periodDates, predictedDates, fertileDates, ovulationDate, logs, onSelectDate }: Props) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
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
          <Text key={`${day}-${index}`} style={styles.weekday}>
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
          const isFertile = fertileDates.has(key);
          const isOvulation = ovulationDate === key;
          const muted = !isSameMonth(day, month);

          return (
            <Pressable
              key={key}
              onPress={() => onSelectDate(key)}
              style={[
                styles.day,
                isFertile && styles.fertile,
                isOvulation && styles.ovulation,
                isPeriod && styles.period,
                isPredicted && styles.predicted,
                muted && styles.muted
              ]}
            >
              <Text style={[styles.dayText, isPeriod && styles.periodText, muted && styles.mutedText]}>{format(day, "d")}</Text>
              {isPredicted && !isPeriod ? <Text style={styles.predictedMark}>~</Text> : null}
              {isOvulation && !isPeriod ? <Text style={styles.ovulationMark}>*</Text> : null}
              {hasLog ? <View style={[styles.dot, isPeriod && styles.lightDot]} /> : null}
            </Pressable>
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
    backgroundColor: colors.canvas,
    borderColor: "#F8E8DF",
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 7,
    position: "relative",
    width: "13.15%"
  },
  dayText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  dot: {
    backgroundColor: colors.berry,
    borderRadius: 3,
    bottom: 7,
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
    backgroundColor: "#E7F4FB",
    borderColor: "#9FD2EE"
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
  period: {
    backgroundColor: colors.coral
  },
  periodText: {
    color: colors.surface
  },
  predicted: {
    backgroundColor: "#FFF0B8",
    borderColor: "#F7D770"
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
    backgroundColor: "#BFE4FA",
    borderColor: colors.sky
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
    marginBottom: spacing.sm
  },
  weekday: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    width: "14.285%"
  },
  wrapper: {
    gap: spacing.xs
  }
});
