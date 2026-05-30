import { Ionicons } from "@expo/vector-icons";
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useEffect, useState } from "react";
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { AnimatedPressable } from "./AnimatedPressable";
import { DEFAULT_SETTINGS, deleteAllData, saveSettings } from "../data/storage";
import { AppPalette, colors, spacing, themePresets, ThemeDefinition, useTheme } from "../theme";
import { AvatarPreset, ThemePreset, TrackerData } from "../types";
import { motion, timingConfig } from "../utils/animation";
import { cancelBloomNotifications, formatNotificationTime, refreshBloomNotifications } from "../utils/notifications";
import { PrimaryButton } from "./PrimaryButton";

type Props = {
  data: TrackerData;
  visible: boolean;
  onClose: () => void;
  onReset?: () => void;
  refreshData: () => Promise<void>;
};

const ML_PER_HYDRATION_UNIT = 250;
const THEME_PRESET_LIST = Object.values(themePresets);
const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const PERIODS = ["AM", "PM"] as const;
const AVATAR_OPTIONS: { id: AvatarPreset; label: string; symbol: string }[] = [
  { id: "initial", label: "Initial", symbol: "B" },
  { id: "cat", label: "Cat", symbol: "🐱" },
  { id: "dog", label: "Dog", symbol: "🐶" },
  { id: "bunny", label: "Bunny", symbol: "🐰" },
  { id: "panda", label: "Panda", symbol: "🐼" },
  { id: "moon", label: "Moon", symbol: "🌙" },
  { id: "flower", label: "Flower", symbol: "🌸" },
  { id: "sparkle", label: "Sparkle", symbol: "✨" },
  { id: "heart", label: "Heart", symbol: "💗" }
];

export function HamburgerMenu({ data, visible, onClose, onReset, refreshData }: Props) {
  const appTheme = useTheme();
  const [periodLength, setPeriodLength] = useState(data.settings.periodLength);
  const [cycleLength, setCycleLength] = useState(data.settings.cycleLength);
  const [hydrationGoal, setHydrationGoal] = useState(data.settings.hydrationGoal);
  const [avatarPreset, setAvatarPreset] = useState<AvatarPreset>(data.settings.avatarPreset);
  const [notificationsEnabled, setNotificationsEnabled] = useState(data.settings.notificationsEnabled);
  const [notificationHour, setNotificationHour] = useState(data.settings.notificationHour);
  const [notificationMinute, setNotificationMinute] = useState(data.settings.notificationMinute);
  const [themePreset, setThemePreset] = useState<ThemePreset>(data.settings.themePreset);
  const [saved, setSaved] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [rendered, setRendered] = useState(visible);
  const [timeEditorOpen, setTimeEditorOpen] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const reduceMotion = useReducedMotion();
  const drawerProgress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setPeriodLength(data.settings.periodLength);
      setCycleLength(data.settings.cycleLength);
      setHydrationGoal(data.settings.hydrationGoal);
      setAvatarPreset(data.settings.avatarPreset);
      setNotificationsEnabled(data.settings.notificationsEnabled);
      setNotificationHour(data.settings.notificationHour);
      setNotificationMinute(data.settings.notificationMinute);
      setThemePreset(data.settings.themePreset);
      setSaved(false);
      setPermissionMessage("");
      setTimeEditorOpen(false);
      setAvatarPickerVisible(false);
    }
  }, [
    data.settings.cycleLength,
    data.settings.periodLength,
    data.settings.hydrationGoal,
    data.settings.avatarPreset,
    data.settings.notificationHour,
    data.settings.notificationMinute,
    data.settings.notificationsEnabled,
    data.settings.themePreset,
    visible
  ]);

  useEffect(() => {
    if (!rendered && !visible) {
      return;
    }

    if (visible) {
      setRendered(true);
      drawerProgress.value = withTiming(1, timingConfig(motion.duration.base, reduceMotion));
      return;
    }

    drawerProgress.value = withTiming(0, timingConfig(motion.duration.fast, reduceMotion), () => {
      runOnJS(setRendered)(false);
    });
  }, [drawerProgress, reduceMotion, rendered, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: drawerProgress.value
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: reduceMotion ? 0 : (1 - drawerProgress.value) * 28 }]
  }));

  const confirmDelete = () => {
    Alert.alert("Delete all data?", "This clears all cycles, logs, symptoms, notes, and settings from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await cancelBloomNotifications(data.settings.notificationIds);
          await deleteAllData();
          await saveSettings(DEFAULT_SETTINGS);
          await refreshData();
          onReset?.();
          onClose();
        }
      }
    ]);
  };

  const adjustCycle = (amount: number) => {
    setSaved(false);
    setCycleLength((value) => Math.min(45, Math.max(18, value + amount)));
  };

  const adjustPeriod = (amount: number) => {
    setSaved(false);
    setPeriodLength((value) => Math.min(12, Math.max(1, value + amount)));
  };

  const adjustHydrationGoal = (amount: number) => {
    setSaved(false);
    setHydrationGoal((value) => Math.min(16, Math.max(4, value + amount)));
  };

  const persistSettings = async () => {
    setPermissionMessage("");
    let nextSettings = {
      ...data.settings,
      periodLength,
      cycleLength,
      hydrationGoal,
      avatarPreset,
      notificationHour,
      notificationMinute,
      notificationsEnabled,
      themePreset
    };

    nextSettings = await refreshBloomNotifications(nextSettings, { requestPermission: notificationsEnabled });
    await saveSettings(nextSettings);
    await refreshData();
    setNotificationsEnabled(nextSettings.notificationsEnabled);
    setNotificationHour(nextSettings.notificationHour);
    setNotificationMinute(nextSettings.notificationMinute);
    setPermissionMessage(nextSettings.notificationsEnabled || !notificationsEnabled ? "" : "Notifications are off because permission was not allowed.");
    setSaved(true);
  };

  if (!rendered) {
    return null;
  }

  const activeTheme = themePresets[themePreset] ?? themePresets.classicRose;
  const activePalette = activeTheme.palette;
  const avatarSymbol = getAvatarSymbol(avatarPreset, data.settings.displayName);

  return (
    <Modal animationType="none" transparent visible={rendered} onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Animated.View style={[styles.drawer, { backgroundColor: activePalette.canvas }, drawerStyle]}>
          <View style={[styles.header, { backgroundColor: activePalette.canvas, borderBottomColor: activePalette.line }]}>
            <View>
              <Text style={[styles.title, { color: activePalette.ink }]}>Settings</Text>
              <Text style={[styles.headerSubtitle, { color: activePalette.inkSoft }]}>Customize your cycle</Text>
            </View>
            <AnimatedPressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" color={activePalette.ink} size={24} />
            </AnimatedPressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={[styles.settingsIntro, { backgroundColor: activePalette.surface, borderColor: activePalette.line }]}>
              <AnimatedPressable
                accessibilityLabel="Choose avatar"
                onPress={() => setAvatarPickerVisible(true)}
                style={[styles.initialAvatar, { backgroundColor: activePalette.accent }]}
              >
                <Text style={[styles.initialText, { color: activePalette.surface }]}>{avatarSymbol}</Text>
                <View style={[styles.avatarEditBadge, { backgroundColor: activePalette.surface, borderColor: activePalette.line }]}>
                  <Ionicons name="pencil" size={13} color={activePalette.accent} />
                </View>
              </AnimatedPressable>
              <View style={styles.settingsIntroText}>
                <Text style={[styles.name, { color: activePalette.ink }]}>{data.settings.displayName || "BloomMate"}</Text>
              </View>
            </View>

            <Text style={[styles.sectionEyebrow, { color: activePalette.inkSoft }]}>Cycle Calibration</Text>
            <View style={styles.settingGroup}>
              <SettingStepper
                theme={activePalette}
                detail="Usually 21-35 days"
                label="Cycle Duration"
                onDecrease={() => adjustCycle(-1)}
                onIncrease={() => adjustCycle(1)}
                value={`${cycleLength} days`}
              />
              <SettingStepper
                theme={activePalette}
                detail="Usually 3-7 days"
                label="Period Length"
                onDecrease={() => adjustPeriod(-1)}
                onIncrease={() => adjustPeriod(1)}
                value={`${periodLength} days`}
              />
              <SettingStepper
                theme={activePalette}
                detail="Daily target shown on Home"
                label="Hydration Limit"
                onDecrease={() => adjustHydrationGoal(-1)}
                onIncrease={() => adjustHydrationGoal(1)}
                value={`${hydrationGoal * ML_PER_HYDRATION_UNIT} ml`}
              />
            </View>

            <Text style={[styles.sectionEyebrow, { color: activePalette.inkSoft }]}>Notification Preferences</Text>
            <View style={styles.settingGroup}>
              <View style={[styles.toggleRow, { backgroundColor: activePalette.surface, borderColor: activePalette.line }]}>
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingLabel, { color: activePalette.ink }]}>Daily Reminder</Text>
                  <Text style={[styles.settingDetail, { color: activePalette.inkSoft }]}>Compliment or quote at {formatNotificationTime(notificationHour, notificationMinute)}</Text>
                </View>
                <Switch
                  ios_backgroundColor="#E7DDD2"
                  onValueChange={(value) => {
                    setSaved(false);
                    setNotificationsEnabled(value);
                  }}
                  thumbColor={activePalette.surface}
                  trackColor={{ false: "#E7DDD2", true: activePalette.accent }}
                  value={notificationsEnabled}
                />
              </View>
              {notificationsEnabled ? (
                <View style={[styles.preferredTimePanel, { backgroundColor: activePalette.petalSoft }]}>
                  <AnimatedPressable
                    onPress={() => setTimeEditorOpen((value) => !value)}
                    style={styles.preferredTimeRow}
                  >
                    <Text style={[styles.preferredTimeLabel, { color: activePalette.inkMuted }]}>Preferred Time</Text>
                    <View style={[styles.preferredTimeValue, { backgroundColor: activePalette.surface, borderColor: activePalette.line }]}>
                      <Text style={[styles.preferredTimeText, { color: activePalette.ink }]}>{formatCompactTime(notificationHour, notificationMinute)}</Text>
                      <Ionicons name="time-outline" size={18} color={activePalette.ink} />
                    </View>
                  </AnimatedPressable>
                  {timeEditorOpen ? (
                    <View style={styles.timeWheelWrap}>
                      <TimeWheelPicker
                        hour={notificationHour}
                        minute={notificationMinute}
                        onChange={(hour, minute) => {
                          setSaved(false);
                          setNotificationHour(hour);
                          setNotificationMinute(minute);
                        }}
                        theme={activePalette}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <Text style={[styles.sectionEyebrow, { color: activePalette.inkSoft }]}>Theme Preset</Text>
            <View style={styles.themeRow}>
              {THEME_PRESET_LIST.map((theme) => (
                <ThemePresetOption
                  active={themePreset === theme.id}
                  key={theme.id}
                  onPress={() => {
                    setSaved(false);
                    setThemePreset(theme.id);
                  }}
                  theme={theme}
                />
              ))}
            </View>

            {permissionMessage ? <Text style={styles.permission}>{permissionMessage}</Text> : null}
            {saved ? <Text style={[styles.saved, { color: appTheme.accent }]}>Settings saved.</Text> : null}
            <PrimaryButton label="Save settings" onPress={persistSettings} />
            <PrimaryButton label="Delete data" onPress={confirmDelete} variant="danger" />
          </ScrollView>
          {avatarPickerVisible ? (
            <View style={styles.avatarPickerOverlay}>
              <AnimatedPressable style={styles.avatarPickerBackdrop} onPress={() => setAvatarPickerVisible(false)} />
              <View style={[styles.avatarPickerCard, { backgroundColor: activePalette.surface, borderColor: activePalette.line }]}>
                <View style={styles.avatarPickerHeader}>
                  <View>
                    <Text style={[styles.avatarPickerTitle, { color: activePalette.ink }]}>Choose avatar</Text>
                    <Text style={[styles.avatarPickerSubtitle, { color: activePalette.inkSoft }]}>Pick a pet or emoji</Text>
                  </View>
                  <AnimatedPressable onPress={() => setAvatarPickerVisible(false)} style={styles.avatarPickerClose}>
                    <Ionicons name="close" size={20} color={activePalette.ink} />
                  </AnimatedPressable>
                </View>
                <View style={styles.avatarGrid}>
                  {AVATAR_OPTIONS.map((option) => {
                    const active = avatarPreset === option.id;
                    return (
                      <AnimatedPressable
                        key={option.id}
                        onPress={() => {
                          setSaved(false);
                          setAvatarPreset(option.id);
                          setAvatarPickerVisible(false);
                        }}
                        style={[
                          styles.avatarOption,
                          {
                            backgroundColor: active ? activePalette.accentSoft : activePalette.petalSoft,
                            borderColor: active ? activePalette.accent : activePalette.line
                          }
                        ]}
                      >
                        <Text style={[styles.avatarOptionSymbol, { color: activePalette.accent }]}>
                          {option.id === "initial" ? getAvatarSymbol("initial", data.settings.displayName) : option.symbol}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function getAvatarSymbol(preset: AvatarPreset, displayName: string) {
  if (preset === "initial") {
    const name = displayName.trim() || "B";
    return name.charAt(0).toUpperCase();
  }

  return AVATAR_OPTIONS.find((option) => option.id === preset)?.symbol ?? "B";
}

function SettingStepper({
  detail,
  label,
  onDecrease,
  onIncrease,
  theme,
  value
}: {
  detail: string;
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  theme: AppPalette;
  value: string;
}) {
  return (
    <View style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.settingTextWrap}>
        <Text style={[styles.settingLabel, { color: theme.ink }]}>{label}</Text>
        <Text style={[styles.settingDetail, { color: theme.inkSoft }]}>{detail}</Text>
      </View>
      <View style={styles.rowStepper}>
        <AnimatedPressable onPress={onDecrease} style={[styles.roundControl, { backgroundColor: theme.petal }]}>
          <Text style={[styles.roundControlText, { color: theme.ink }]}>-</Text>
        </AnimatedPressable>
        <Text style={[styles.rowStepValue, { color: theme.ink }]}>{value}</Text>
        <AnimatedPressable onPress={onIncrease} style={[styles.roundControl, { backgroundColor: theme.petal }]}>
          <Text style={[styles.roundControlText, { color: theme.ink }]}>+</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function TimeWheelPicker({
  hour,
  minute,
  onChange,
  theme
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  theme: AppPalette;
}) {
  const display = toDisplayTime(hour);
  const safeMinute = Math.min(55, Math.max(0, Math.round(minute / 5) * 5));

  const updateHour = (nextHour: number) => {
    onChange(toTwentyFourHour(nextHour, display.period), safeMinute);
  };

  const updateMinute = (nextMinute: number) => {
    onChange(hour, nextMinute);
  };

  const updatePeriod = (nextPeriod: "AM" | "PM") => {
    onChange(toTwentyFourHour(display.hour, nextPeriod), safeMinute);
  };

  return (
    <View style={styles.timeWheel}>
      <TimeWheelColumn
        items={HOURS.map((value) => ({ label: String(value), value }))}
        onSelect={updateHour}
        selectedValue={display.hour}
        theme={theme}
      />
      <TimeWheelColumn
        items={MINUTES.map((value) => ({ label: value.toString().padStart(2, "0"), value }))}
        onSelect={updateMinute}
        selectedValue={safeMinute}
        theme={theme}
      />
      <TimeWheelColumn
        items={PERIODS.map((value) => ({ label: value, value }))}
        onSelect={updatePeriod}
        selectedValue={display.period}
        theme={theme}
      />
    </View>
  );
}

function TimeWheelColumn<T extends number | string>({
  items,
  onSelect,
  selectedValue,
  theme
}: {
  items: { label: string; value: T }[];
  onSelect: (value: T) => void;
  selectedValue: T;
  theme: AppPalette;
}) {
  return (
    <ScrollView contentContainerStyle={styles.timeColumnContent} showsVerticalScrollIndicator={false} style={[styles.timeColumn, { borderColor: theme.line }]}>
      {items.map((item) => {
        const selected = item.value === selectedValue;
        return (
          <AnimatedPressable
            key={String(item.value)}
            onPress={() => onSelect(item.value)}
            style={[styles.timeOption, selected && { backgroundColor: theme.accent, borderColor: theme.accent }]}
          >
            <Text style={[styles.timeOptionText, { color: selected ? theme.surface : theme.inkMuted }]}>{item.label}</Text>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

function toDisplayTime(hour: number) {
  return {
    hour: hour % 12 === 0 ? 12 : hour % 12,
    period: hour >= 12 ? ("PM" as const) : ("AM" as const)
  };
}

function toTwentyFourHour(hour: number, period: "AM" | "PM") {
  if (period === "AM") {
    return hour === 12 ? 0 : hour;
  }

  return hour === 12 ? 12 : hour + 12;
}

function formatCompactTime(hour: number, minute: number) {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function ThemePresetOption({
  active,
  onPress,
  theme
}: {
  active: boolean;
  onPress: () => void;
  theme: ThemeDefinition;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.themeOption, { backgroundColor: theme.palette.surface, borderColor: active ? theme.palette.accent : theme.palette.line }]}
    >
      <View style={styles.themeSwatches}>
        {theme.swatches.map((swatch) => (
          <View key={swatch} style={[styles.themeDot, { backgroundColor: swatch }]} />
        ))}
      </View>
      <Text style={[styles.themeLabel, { color: theme.palette.ink }]}>{theme.label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "stretch",
    backgroundColor: colors.canvas,
    flex: 1
  },
  body: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  avatarEditBadge: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    bottom: -2,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: -2,
    width: 28
  },
  avatarOption: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexGrow: 1,
    gap: 5,
    justifyContent: "center",
    minHeight: 74,
    minWidth: 86,
    padding: spacing.sm
  },
  avatarOptionLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "900"
  },
  avatarOptionSymbol: {
    color: colors.berry,
    fontSize: 24,
    fontWeight: "900"
  },
  avatarPickerBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  avatarPickerCard: {
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg
  },
  avatarPickerClose: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  avatarPickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  avatarPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(45, 35, 39, 0.32)",
    justifyContent: "center"
  },
  avatarPickerSubtitle: {
    color: colors.inkSoft,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2
  },
  avatarPickerTitle: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 22,
    fontWeight: "900"
  },
  closeButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40
  },
  copy: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: spacing.md
  },
  drawer: {
    backgroundColor: colors.surface,
    flex: 1,
    width: "100%"
  },
  goal: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: 58
  },
  headerSubtitle: {
    color: colors.inkSoft,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.5,
    marginTop: 4,
    textTransform: "uppercase"
  },
  initialAvatar: {
    alignItems: "center",
    backgroundColor: colors.berry,
    borderRadius: 42,
    height: 72,
    justifyContent: "center",
    position: "relative",
    width: 72
  },
  initialText: {
    color: colors.surface,
    fontFamily: "Georgia",
    fontSize: 34,
    fontWeight: "900"
  },
  name: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: spacing.sm
  },
  permission: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: spacing.sm,
    textAlign: "center"
  },
  saved: {
    color: colors.berry,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: spacing.sm,
    textAlign: "center"
  },
  sectionEyebrow: {
    color: colors.inkSoft,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2.6,
    marginTop: spacing.md,
    textTransform: "uppercase"
  },
  settingDetail: {
    color: colors.inkSoft,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3
  },
  settingGroup: {
    gap: spacing.sm
  },
  settingLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  settingRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 84,
    padding: spacing.md
  },
  settingsIntro: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg
  },
  settingsIntroText: {
    flex: 1
  },
  settingTextWrap: {
    flex: 1
  },
  statTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  rowStepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  rowStepValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    minWidth: 72,
    textAlign: "center"
  },
  roundControl: {
    alignItems: "center",
    backgroundColor: colors.petal,
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  roundControlText: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  preferredTimeLabel: {
    fontSize: 15,
    fontWeight: "900"
  },
  preferredTimePanel: {
    borderRadius: 20,
    padding: spacing.md
  },
  preferredTimeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44
  },
  preferredTimeText: {
    fontSize: 18,
    fontWeight: "900"
  },
  preferredTimeValue: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  timeHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  timeColumn: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    maxHeight: 156
  },
  timeColumnContent: {
    gap: spacing.xs,
    padding: spacing.xs
  },
  timeOption: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center"
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: "900"
  },
  timePanel: {
    backgroundColor: colors.canvas,
    borderRadius: 12,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md
  },
  timeValue: {
    color: colors.berry,
    fontSize: 22,
    fontWeight: "900"
  },
  timeWheel: {
    flexDirection: "row",
    gap: spacing.sm
  },
  timeWheelWrap: {
    marginTop: spacing.md
  },
  themeDot: {
    borderRadius: 9,
    height: 18,
    width: 18
  },
  themeLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
    textAlign: "center"
  },
  themeOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 104,
    padding: spacing.sm
  },
  themeRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  themeSwatches: {
    flexDirection: "row",
    gap: 5
  },
  title: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 28,
    fontWeight: "900"
  },
  toggleRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 78,
    padding: spacing.md
  }
});
