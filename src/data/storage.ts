import * as SQLite from "expo-sqlite";
import { addDays, format, parseISO } from "date-fns";

import { Cycle, DailyLog, FlowLevel, TrackerData, TrackerSettings } from "../types";

let database: SQLite.SQLiteDatabase | null = null;

export const DEFAULT_SETTINGS: TrackerSettings = {
  displayName: "",
  recentFactIds: [],
  notificationIds: [],
  periodLength: 5,
  cycleLength: 28,
  notificationHour: 9,
  notificationMinute: 0,
  notificationsEnabled: false,
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
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
};

export const loadTrackerData = async (): Promise<TrackerData> => {
  const db = await getDatabase();
  const cycles = await db.getAllAsync<Cycle>("SELECT * FROM cycles ORDER BY startDate DESC");
  const rawLogs = await db.getAllAsync<{ date: string; flow: FlowLevel; symptoms: string; notes: string }>(
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

      if (item.key === "recentFactIds" || item.key === "notificationIds") {
        return { ...current, [item.key]: JSON.parse(item.value) };
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
      notes: log.notes
    }))
  };
};

export const saveSettings = async (settings: TrackerSettings) => {
  const db = await getDatabase();
  const entries: [keyof TrackerSettings, string][] = [
    ["displayName", settings.displayName],
    ["recentFactIds", JSON.stringify(settings.recentFactIds)],
    ["notificationIds", JSON.stringify(settings.notificationIds)],
    ["periodLength", String(settings.periodLength)],
    ["cycleLength", String(settings.cycleLength)],
    ["notificationHour", String(settings.notificationHour)],
    ["notificationMinute", String(settings.notificationMinute)],
    ["notificationsEnabled", String(settings.notificationsEnabled)],
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

export const startPeriod = async (date: string) => {
  const db = await getDatabase();
  const openCycle = await db.getFirstAsync<Cycle>("SELECT * FROM cycles WHERE endDate IS NULL ORDER BY startDate DESC LIMIT 1");

  if (!openCycle) {
    await db.runAsync("INSERT INTO cycles (startDate) VALUES (?)", date);
  }

  await upsertDailyLog(date, "medium", [], "");
};

export const endPeriod = async (date: string) => {
  const db = await getDatabase();
  const openCycle = await db.getFirstAsync<Cycle>("SELECT * FROM cycles WHERE endDate IS NULL ORDER BY startDate DESC LIMIT 1");

  if (openCycle) {
    await db.runAsync("UPDATE cycles SET endDate = ? WHERE id = ?", date, openCycle.id);
  }
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

export const deleteAllData = async () => {
  const db = await getDatabase();
  await db.execAsync("DELETE FROM daily_logs; DELETE FROM cycles; DELETE FROM settings;");
};
