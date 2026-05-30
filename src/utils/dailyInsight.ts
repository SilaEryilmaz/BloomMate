import { differenceInCalendarDays, parseISO } from "date-fns";

import { TrackerData } from "../types";
import {
  getCycleDay,
  getCyclePhaseDateKeys,
  getNextPeriodStart,
  getPeriodDateKeys,
  todayKey
} from "./cycle";

type InsightLabel = "Period" | "Follicular" | "Fertile Window" | "Ovulation" | "Luteal" | "Getting Started";

export type DailyInsight = {
  body: string;
  label: InsightLabel;
  title: string;
};

const FACTS: Record<InsightLabel, string[]> = {
  "Getting Started": [
    "A menstrual cycle is counted from the first day of one period to the first day of the next.",
    "A 28-day cycle is often used as an example, but many real cycles are naturally shorter or longer.",
    "Cycle patterns are easier to understand across several months, not from one cycle alone.",
    "Period timing can shift because ovulation timing can shift earlier or later.",
    "The cycle includes both ovarian changes and uterine lining changes happening together.",
    "Hormones act like signals between the brain, ovaries, and uterus throughout the cycle."
  ],
  Period: [
    "A period happens when the uterine lining sheds after estrogen and progesterone drop.",
    "Period flow can change day to day because the uterine lining sheds gradually.",
    "Cramps are often linked to uterine contractions that help move menstrual blood out.",
    "Period blood can vary in color and texture because it may leave the uterus at different speeds.",
    "The first days of a period are often heavier because more lining is shedding at once.",
    "A period is one phase of the cycle, not separate from the rest of the month."
  ],
  Follicular: [
    "The follicular phase begins on the first day of the period and continues until ovulation.",
    "During this phase, follicles in the ovaries develop, and one may become dominant.",
    "Estrogen often rises during the follicular phase as the body prepares for ovulation.",
    "The uterine lining starts rebuilding after the period during this part of the cycle.",
    "The follicular phase is often the part of the cycle that varies most in length.",
    "Cervical fluid may become more noticeable as estrogen rises before ovulation."
  ],
  "Fertile Window": [
    "The fertile window is a range of days, not one exact day.",
    "This window includes days before ovulation because sperm can survive for several days.",
    "Cervical fluid can become clearer, wetter, or stretchier near ovulation for some people.",
    "Date-based fertile windows are estimates because ovulation can shift from cycle to cycle.",
    "Stress, sleep changes, illness, travel, and normal variation can affect ovulation timing.",
    "Fertile-window signs are body clues, not guarantees."
  ],
  Ovulation: [
    "Ovulation happens when an ovary releases an egg.",
    "Ovulation usually happens after a rise in luteinizing hormone.",
    "The egg lives for a short time after ovulation, which is why the days before matter too.",
    "Some people notice ovulation signs, while others notice nothing at all.",
    "Mild one-sided pelvic discomfort can happen around ovulation for some people.",
    "Ovulation is easier to estimate over time because one cycle alone can be misleading."
  ],
  Luteal: [
    "The luteal phase begins after ovulation.",
    "Progesterone rises during the luteal phase and helps prepare the uterine lining.",
    "If pregnancy does not happen, progesterone and estrogen drop before the next period.",
    "PMS-like changes often happen in the luteal phase as hormones shift.",
    "Sleep, appetite, breast tenderness, mood, and energy can feel different in this phase.",
    "The luteal phase is often more consistent in length than the follicular phase, though it still varies."
  ]
};

export const getDailyInsight = (data: TrackerData): DailyInsight => {
  const today = todayKey();
  const cycleDay = getCycleDay(data.cycles);
  const nextPeriod = getNextPeriodStart(data.cycles, data.settings);
  const daysUntilPeriod = nextPeriod ? differenceInCalendarDays(parseISO(nextPeriod), new Date()) : null;
  const periodDates = getPeriodDateKeys(data.cycles, data.settings);
  const phases = getCyclePhaseDateKeys(data.cycles, data.settings);

  if (data.cycles.length === 0) {
    return buildInsight("Getting Started", "Cycle basics", today);
  }

  if (periodDates.has(today)) {
    return buildInsight("Period", cycleDay ? `Period phase - day ${cycleDay}` : "Period phase", today);
  }

  if (phases.ovulationDates.has(today)) {
    return buildInsight("Ovulation", "Estimated ovulation", today);
  }

  if (phases.fertileDates.has(today)) {
    return buildInsight("Fertile Window", "Estimated fertile window", today);
  }

  if (phases.lutealDates.has(today) || (daysUntilPeriod !== null && daysUntilPeriod >= 0 && daysUntilPeriod <= 7)) {
    return buildInsight("Luteal", daysUntilPeriod !== null && daysUntilPeriod >= 0 ? `Period estimate in ${daysUntilPeriod} days` : "Luteal phase", today);
  }

  if (phases.follicularDates.has(today)) {
    return buildInsight("Follicular", "Follicular phase", today);
  }

  return buildInsight("Getting Started", cycleDay ? `Cycle day ${cycleDay}` : "Cycle basics", today);
};

const buildInsight = (label: InsightLabel, title: string, dateKey: string): DailyInsight => ({
  body: pickFact(label, dateKey),
  label,
  title
});

const pickFact = (label: InsightLabel, dateKey: string) => {
  const facts = FACTS[label];
  const dayNumber = Number(dateKey.slice(-2));
  return facts[Number.isNaN(dayNumber) ? 0 : dayNumber % facts.length];
};
