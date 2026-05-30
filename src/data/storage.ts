import * as SQLite from "expo-sqlite";
import { addDays, format, parseISO } from "date-fns";

import { AvatarPreset, Cycle, DailyLog, FlowLevel, ThemePreset, TrackerData, TrackerSettings } from "../types";

let database: SQLite.SQLiteDatabase | null = null;

export const DEFAULT_SETTINGS: TrackerSettings = {
  displayName: "",
  avatarPreset: "initial",
  recentFactIds: [],
  notificationIds: [],
  periodLength: 5,
  cycleLength: 28,
  notificationHour: 9,
  notificationMinute: 0,
  notificationsEnabled: false,
  hydrationGoal: 8,
  themePreset: "classicRose",
  onboardingComplete: false
};

const getDatabase = async () => {
  if (!database) {
    database = await SQLite.openDatabaseAsync("bloom.db");
  }
  return database;
};

export const initDatabase = async () => {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startDate TEXT NOT NULL,
      endDate TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      date TEXT PRIMARY KEY NOT NULL,
      flow TEXT NOT NULL DEFAULT 'none',
      symptoms TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      waterCups INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const dailyLogColumns = await db.getAllAsync<{ name: string }>("PRAGMA table_info(daily_logs)");
  if (!dailyLogColumns.some((column) => column.name === "waterCups")) {
    await db.runAsync("ALTER TABLE daily_logs ADD COLUMN waterCups INTEGER NOT NULL DEFAULT 0");
  }
};

export const loadTrackerData = async (): Promise<TrackerData> => {
  const db = await getDatabase();
  const cycles = await db.getAllAsync<Cycle>("SELECT * FROM cycles ORDER BY startDate DESC");
  const rawLogs = await db.getAllAsync<{ date: string; flow: FlowLevel; symptoms: string; notes: string; waterCups: number }>(
    "SELECT * FROM daily_logs ORDER BY date DESC"
  );
  const rawSettings = await db.getAllAsync<{ key: keyof TrackerSettings; value: string }>("SELECT * FROM settings");
  const settings = rawSettings.reduce<TrackerSettings>(
    (current, item) => {
      if (item.key === "onboardingComplete" || item.key === "notificationsEnabled") {
        return { ...current, [item.key]: item.value === "true" };
      }

      if (item.key === "displayName") {
        return { ...current, displayName: item.value };
      }

      if (item.key === "avatarPreset") {
        return { ...current, avatarPreset: normalizeAvatarPreset(item.value) };
      }

      if (item.key === "themePreset") {
        return { ...current, themePreset: isThemePreset(item.value) ? item.value : DEFAULT_SETTINGS.themePreset };
      }

      if (item.key === "recentFactIds" || item.key === "notificationIds") {
        return { ...current, [item.key]: parseStringArraySetting(item.value) };
      }

      return { ...current, [item.key]: Number(item.value) };
    },
    DEFAULT_SETTINGS
  );

  return {
    cycles,
    settings,
    logs: rawLogs.map((log) => ({
      date: log.date,
      flow: log.flow,
      symptoms: JSON.parse(log.symptoms),
      notes: log.notes,
      waterCups: log.waterCups ?? 0
    }))
  };
};

const parseStringArraySetting = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const isThemePreset = (value: string): value is ThemePreset => value === "classicRose" || value === "deepOrchid" || value === "nordicSage";

const normalizeAvatarPreset = (value: string): AvatarPreset => {
  if (value === "water") {
    return "heart";
  }

  return isAvatarPreset(value) ? value : DEFAULT_SETTINGS.avatarPreset;
};

const isAvatarPreset = (value: string): value is AvatarPreset =>
  value === "initial" ||
  value === "cat" ||
  value === "dog" ||
  value === "bunny" ||
  value === "panda" ||
  value === "moon" ||
  value === "flower" ||
  value === "sparkle" ||
  value === "heart";

export const saveSettings = async (settings: TrackerSettings) => {
  const db = await getDatabase();
  const entries: [keyof TrackerSettings, string][] = [
    ["displayName", settings.displayName],
    ["avatarPreset", settings.avatarPreset],
    ["recentFactIds", JSON.stringify(settings.recentFactIds)],
    ["notificationIds", JSON.stringify(settings.notificationIds)],
    ["periodLength", String(settings.periodLength)],
    ["cycleLength", String(settings.cycleLength)],
    ["notificationHour", String(settings.notificationHour)],
    ["notificationMinute", String(settings.notificationMinute)],
    ["notificationsEnabled", String(settings.notificationsEnabled)],
    ["hydrationGoal", String(settings.hydrationGoal)],
    ["themePreset", settings.themePreset],
    ["onboardingComplete", String(settings.onboardingComplete)]
  ];

  for (const [key, value] of entries) {
    await db.runAsync(
      `INSERT INTO settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value
    );
  }
};

export const saveOnboarding = async (settings: TrackerSettings, lastPeriodStart: string) => {
  const db = await getDatabase();
  await saveSettings({ ...settings, onboardingComplete: true });

  const existingCycles = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM cycles");
  if ((existingCycles?.count ?? 0) === 0) {
    const endDate = format(addDays(parseISO(lastPeriodStart), settings.periodLength - 1), "yyyy-MM-dd");
    await db.runAsync("INSERT INTO cycles (startDate, endDate) VALUES (?, ?)", lastPeriodStart, endDate);
  }
};

export const startPeriod = async (date: string, periodLength = DEFAULT_SETTINGS.periodLength) => {
  const db = await getDatabase();
  const openCycle = await db.getFirstAsync<Cycle>("SELECT * FROM cycles WHERE endDate IS NULL ORDER BY startDate DESC LIMIT 1");

  if (openCycle) {
    return;
  }

  const cycles = await db.getAllAsync<Cycle>("SELECT * FROM cycles ORDER BY startDate DESC");
  const existingCycleForDate = cycles.find((cycle) => {
    const effectiveEndDate = cycle.endDate ?? format(addDays(parseISO(cycle.startDate), periodLength - 1), "yyyy-MM-dd");
    return cycle.startDate <= date && date <= effectiveEndDate;
  });

  if (!existingCycleForDate) {
    await db.runAsync("INSERT INTO cycles (startDate) VALUES (?)", date);
  }
};

export const addPeriodForDate = async (date: string, periodLength: number) => {
  const db = await getDatabase();
  const endDate = format(addDays(parseISO(date), periodLength - 1), "yyyy-MM-dd");
  await db.runAsync("INSERT INTO cycles (startDate, endDate) VALUES (?, ?)", date, endDate);
};

export const endPeriod = async (date: string, periodLength = DEFAULT_SETTINGS.periodLength) => {
  const db = await getDatabase();
  const openCycle = await db.getFirstAsync<Cycle>("SELECT * FROM cycles WHERE endDate IS NULL ORDER BY startDate DESC LIMIT 1");

  if (openCycle) {
    const endDate = date < openCycle.startDate ? openCycle.startDate : date;
    await db.runAsync("UPDATE cycles SET endDate = ? WHERE id = ?", endDate, openCycle.id);
    return;
  }

  const cycles = await db.getAllAsync<Cycle>("SELECT * FROM cycles ORDER BY startDate DESC");
  const matchingCycle = cycles.find((cycle) => {
    const effectiveEndDate = cycle.endDate ?? format(addDays(parseISO(cycle.startDate), periodLength - 1), "yyyy-MM-dd");
    return cycle.startDate <= date && date <= effectiveEndDate;
  });

  if (matchingCycle) {
    const endDate = date < matchingCycle.startDate ? matchingCycle.startDate : date;
    await db.runAsync("UPDATE cycles SET endDate = ? WHERE id = ?", endDate, matchingCycle.id);
  }
};

export const removePeriodForDate = async (date: string, periodLength: number) => {
  const db = await getDatabase();
  const cycles = await db.getAllAsync<Cycle>("SELECT * FROM cycles ORDER BY startDate DESC");
  const matchingCycle = cycles.find((cycle) => {
    const effectiveEndDate = cycle.endDate ?? format(addDays(parseISO(cycle.startDate), periodLength - 1), "yyyy-MM-dd");
    return cycle.startDate <= date && date <= effectiveEndDate;
  });

  if (!matchingCycle) {
    return;
  }

  const effectiveEndDate =
    matchingCycle.endDate ?? format(addDays(parseISO(matchingCycle.startDate), periodLength - 1), "yyyy-MM-dd");

  await db.runAsync("DELETE FROM cycles WHERE id = ?", matchingCycle.id);

  const periodDates = eachDateKeys(matchingCycle.startDate, effectiveEndDate);
  for (const periodDate of periodDates) {
    const log = await db.getFirstAsync<{ flow: FlowLevel; symptoms: string; notes: string }>(
      "SELECT flow, symptoms, notes FROM daily_logs WHERE date = ?",
      periodDate
    );
    if (log && log.flow !== "none" && JSON.parse(log.symptoms).length === 0 && log.notes.trim().length === 0) {
      await db.runAsync("UPDATE daily_logs SET flow = 'none' WHERE date = ?", periodDate);
    }
  }
};

export const removePeriodDate = removePeriodForDate;

const eachDateKeys = (startDate: string, endDate: string) => {
  const keys: string[] = [];
  let cursor = parseISO(startDate);
  const end = parseISO(endDate);

  while (cursor <= end) {
    keys.push(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }

  return keys;
};

export const upsertDailyLog = async (date: string, flow: FlowLevel, symptoms: string[], notes: string) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO daily_logs (date, flow, symptoms, notes)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET flow = excluded.flow, symptoms = excluded.symptoms, notes = excluded.notes`,
    date,
    flow,
    JSON.stringify(symptoms),
    notes
  );
};

export const updateDailyWaterCups = async (date: string, waterCups: number) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO daily_logs (date, flow, symptoms, notes, waterCups)
     VALUES (?, 'none', '[]', '', ?)
     ON CONFLICT(date) DO UPDATE SET waterCups = excluded.waterCups`,
    date,
    waterCups
  );
};

export const deleteAllData = async () => {
  const db = await getDatabase();
  await db.execAsync("DELETE FROM daily_logs; DELETE FROM cycles; DELETE FROM settings;");
};

export const clearDailyLogs = async () => {
  const db = await getDatabase();
  await db.execAsync("DELETE FROM daily_logs;");
};
