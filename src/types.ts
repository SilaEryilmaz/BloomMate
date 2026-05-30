export type FlowLevel = "none" | "light" | "medium" | "heavy";

export type ThemePreset = "classicRose" | "deepOrchid" | "nordicSage";

export type AvatarPreset = "initial" | "cat" | "dog" | "bunny" | "panda" | "moon" | "flower" | "sparkle" | "heart";

export type Cycle = {
  id: number;
  startDate: string;
  endDate: string | null;
};

export type DailyLog = {
  date: string;
  flow: FlowLevel;
  symptoms: string[];
  notes: string;
  waterCups: number;
};

export type TrackerSettings = {
  displayName: string;
  avatarPreset: AvatarPreset;
  recentFactIds: string[];
  notificationIds: string[];
  periodLength: number;
  cycleLength: number;
  notificationHour: number;
  notificationMinute: number;
  notificationsEnabled: boolean;
  hydrationGoal: number;
  themePreset: ThemePreset;
  onboardingComplete: boolean;
};

export type TrackerData = {
  cycles: Cycle[];
  logs: DailyLog[];
  settings: TrackerSettings;
};

export type ScreenProps = {
  data: TrackerData;
  refreshData: () => Promise<void>;
};
