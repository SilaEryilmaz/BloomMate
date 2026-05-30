import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isAfter,
  parseISO
} from "date-fns";

import { Cycle, DailyLog, TrackerSettings } from "../types";

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;

export const todayKey = () => format(new Date(), "yyyy-MM-dd");

export const formatFriendlyDate = (date: string) => format(parseISO(date), "MMM d");

export const getAverageCycleLength = (cycles: Cycle[], settings?: TrackerSettings) => {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const gaps = sorted
    .slice(1)
    .map((cycle, index) => differenceInCalendarDays(parseISO(cycle.startDate), parseISO(sorted[index].startDate)))
    .filter((gap) => gap >= 18 && gap <= 45);

  if (gaps.length === 0) {
    return settings?.cycleLength ?? DEFAULT_CYCLE_LENGTH;
  }

  return Math.round(gaps.reduce((total, gap) => total + gap, 0) / gaps.length);
};

export const getAveragePeriodLength = (cycles: Cycle[], settings?: TrackerSettings) => {
  const lengths = cycles
    .filter((cycle) => cycle.endDate)
    .map((cycle) => differenceInCalendarDays(parseISO(cycle.endDate as string), parseISO(cycle.startDate)) + 1)
    .filter((length) => length >= 1 && length <= 12);

  if (lengths.length === 0) {
    return settings?.periodLength ?? DEFAULT_PERIOD_LENGTH;
  }

  return Math.round(lengths.reduce((total, length) => total + length, 0) / lengths.length);
};

export const getLatestCycle = (cycles: Cycle[]) => cycles[0] ?? null;

export const getCycleDay = (cycles: Cycle[]) => {
  const latest = getLatestCycle(cycles);
  if (!latest) {
    return null;
  }

  return differenceInCalendarDays(new Date(), parseISO(latest.startDate)) + 1;
};

export const getNextPeriodStart = (cycles: Cycle[], settings?: TrackerSettings) => {
  const latest = getLatestCycle(cycles);
  if (!latest) {
    return null;
  }

  return format(addDays(parseISO(latest.startDate), getAverageCycleLength(cycles, settings)), "yyyy-MM-dd");
};

export const getPeriodDateKeys = (cycles: Cycle[], settings?: TrackerSettings) => {
  const keys = new Set<string>();

  cycles.forEach((cycle) => {
    const endDate =
      cycle.endDate ?? format(addDays(parseISO(cycle.startDate), (settings?.periodLength ?? DEFAULT_PERIOD_LENGTH) - 1), "yyyy-MM-dd");
    eachDayOfInterval({ start: parseISO(cycle.startDate), end: parseISO(endDate) }).forEach((date) => {
      keys.add(format(date, "yyyy-MM-dd"));
    });
  });

  return keys;
};

export const getPredictedDateKeys = (cycles: Cycle[], settings?: TrackerSettings) => {
  const nextStart = getNextPeriodStart(cycles, settings);
  const keys = new Set<string>();

  if (!nextStart || !isAfter(parseISO(nextStart), new Date())) {
    return keys;
  }

  const cycleLength = getAverageCycleLength(cycles, settings);
  const periodLength = getAveragePeriodLength(cycles, settings);

  for (let cycleOffset = 0; cycleOffset < 6; cycleOffset += 1) {
    const predictedStart = addDays(parseISO(nextStart), cycleOffset * cycleLength);
    eachDayOfInterval({
      start: predictedStart,
      end: addDays(predictedStart, periodLength - 1)
    }).forEach((date) => keys.add(format(date, "yyyy-MM-dd")));
  }

  return keys;
};

export const getFertilityDateKeys = (cycles: Cycle[], settings?: TrackerSettings) => {
  const nextStart = getNextPeriodStart(cycles, settings);
  const keys = new Set<string>();

  if (!nextStart) {
    return { fertileDates: keys, ovulationDate: null as string | null };
  }

  const ovulation = addDays(parseISO(nextStart), -14);
  const fertileStart = addDays(ovulation, -5);

  eachDayOfInterval({ start: fertileStart, end: ovulation }).forEach((date) => {
    keys.add(format(date, "yyyy-MM-dd"));
  });

  return {
    fertileDates: keys,
    ovulationDate: format(ovulation, "yyyy-MM-dd")
  };
};

export const getCyclePhaseDateKeys = (cycles: Cycle[], settings?: TrackerSettings) => {
  const follicularDates = new Set<string>();
  const lutealDates = new Set<string>();
  const fertileDates = new Set<string>();
  const ovulationDates = new Set<string>();
  const menstrualDates = getPeriodDateKeys(cycles, settings);
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));

  const projected = [...sorted];
  const latestNextStart = getNextPeriodStart(cycles, settings);
  if (latestNextStart) {
    const cycleLength = getAverageCycleLength(cycles, settings);
    for (let cycleOffset = 0; cycleOffset < 6; cycleOffset += 1) {
      const startDate = format(addDays(parseISO(latestNextStart), cycleOffset * cycleLength), "yyyy-MM-dd");
      projected.push({ id: -cycleOffset - 1, startDate, endDate: null });
    }
  }

  projected.forEach((cycle, index) => {
    const nextCycleStart = projected[index + 1]?.startDate ?? null;
    if (!nextCycleStart) {
      return;
    }

    const periodEnd = cycle.endDate ?? format(addDays(parseISO(cycle.startDate), getAveragePeriodLength(cycles, settings) - 1), "yyyy-MM-dd");
    const ovulation = addDays(parseISO(nextCycleStart), -14);
    const fertileStart = addDays(ovulation, -5);
    const follicularStart = addDays(parseISO(periodEnd), 1);
    const follicularEnd = addDays(fertileStart, -1);
    const lutealStart = addDays(ovulation, 1);
    const lutealEnd = addDays(parseISO(nextCycleStart), -1);

    if (!isAfter(follicularStart, follicularEnd)) {
      eachDayOfInterval({ start: follicularStart, end: follicularEnd }).forEach((date) => {
        follicularDates.add(format(date, "yyyy-MM-dd"));
      });
    }

    eachDayOfInterval({ start: fertileStart, end: ovulation }).forEach((date) => {
      fertileDates.add(format(date, "yyyy-MM-dd"));
    });
    ovulationDates.add(format(ovulation, "yyyy-MM-dd"));

    if (!isAfter(lutealStart, lutealEnd)) {
      eachDayOfInterval({ start: lutealStart, end: lutealEnd }).forEach((date) => {
        lutealDates.add(format(date, "yyyy-MM-dd"));
      });
    }
  });

  return {
    menstrualDates,
    follicularDates,
    fertileDates,
    ovulationDates,
    lutealDates
  };
};

export const getLogForDate = (logs: DailyLog[], date: string) => logs.find((log) => log.date === date);
