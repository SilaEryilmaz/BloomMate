export type FlowLevel = "none" | "light" | "medium" | "heavy";

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
};

export type TrackerSettings = {
  periodLength: number;
  cycleLength: number;
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
