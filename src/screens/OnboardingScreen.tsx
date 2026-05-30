import { Ionicons } from "@expo/vector-icons";
import { format, isValid, parseISO, subDays } from "date-fns";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedPressable } from "../components/AnimatedPressable";
import { AnimatedStep } from "../components/AnimatedStep";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { saveOnboarding } from "../data/storage";
import { colors, radii, spacing } from "../theme";
import { TrackerSettings } from "../types";
import { refreshBloomNotifications } from "../utils/notifications";

type Props = {
  refreshData: () => Promise<void>;
};

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const PERIODS = ["AM", "PM"] as const;

export function OnboardingScreen({ refreshData }: Props) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [periodLength, setPeriodLength] = useState(5);
  const [cycleLength, setCycleLength] = useState(28);
  const [lastPeriodStart, setLastPeriodStart] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationHour, setNotificationHour] = useState(9);
  const [notificationMinute, setNotificationMinute] = useState(0);
  const [error, setError] = useState("");

  const isFinalStep = step === 5;
  const adjust = (value: number, amount: number, min: number, max: number) => Math.min(max, Math.max(min, value + amount));

  const submit = async () => {
    const parsedDate = parseISO(lastPeriodStart);
    if (!isValid(parsedDate)) {
      setError("Use a date like 2026-05-28.");
      return;
    }

    let nextSettings: TrackerSettings = {
      displayName: displayName.trim(),
      avatarPreset: "initial",
      recentFactIds: [],
      notificationIds: [],
      periodLength,
      cycleLength,
      notificationHour,
      notificationMinute,
      notificationsEnabled,
      hydrationGoal: 8,
      themePreset: "classicRose",
      onboardingComplete: true
    };

    if (notificationsEnabled) {
      nextSettings = await refreshBloomNotifications(nextSettings, { requestPermission: true });
    }

    await saveOnboarding(nextSettings, format(parsedDate, "yyyy-MM-dd"));
    await refreshData();
  };

  const goNext = async () => {
    if (isFinalStep) {
      await submit();
      return;
    }

    setStep((value) => value + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.shell}>
          <View style={styles.progressRow}>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <ProgressDot active={item <= step} current={item === step} key={item} />
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <AnimatedStep step={step}>
              {step === 0 ? (
                <View style={styles.hero}>
                  <Image source={require("../../assets/bloom-mascot.png")} style={styles.image} />
                  <Text style={styles.kicker}>Welcome to BloomMate</Text>
                  <Text style={styles.title}>Let's make your calendar feel personal.</Text>
                  <Text style={styles.copy}>A few quick questions help BloomMate start with a prediction that already feels close to you.</Text>
                </View>
              ) : null}

              {step === 1 ? (
                <Card style={styles.panel}>
                  <Text style={styles.stepTitle}>What should BloomMate call you?</Text>
                  <Text style={styles.inputLabel}>Your name</Text>
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={setDisplayName}
                    placeholder=""
                    placeholderTextColor={colors.inkMuted}
                    style={styles.input}
                    value={displayName}
                  />
                </Card>
              ) : null}

              {step === 2 ? (
                <Card style={styles.panel}>
                  <Text style={styles.stepTitle}>How long does your period usually last?</Text>
                  <Text style={styles.stepCopy}>This helps BloomMate shade the right number of days in your calendar.</Text>
                  <Stepper
                    icon="water-outline"
                    label="Usual period length"
                    value={`${periodLength} days`}
                    onMinus={() => setPeriodLength((value) => adjust(value, -1, 2, 10))}
                    onPlus={() => setPeriodLength((value) => adjust(value, 1, 2, 10))}
                  />
                </Card>
              ) : null}

              {step === 3 ? (
                <Card style={styles.panel}>
                  <Text style={styles.stepTitle}>How long is your usual cycle?</Text>
                  <Stepper
                    icon="repeat-outline"
                    label="Usual cycle length"
                    value={`${cycleLength} days`}
                    onMinus={() => setCycleLength((value) => adjust(value, -1, 18, 45))}
                    onPlus={() => setCycleLength((value) => adjust(value, 1, 18, 45))}
                  />
                </Card>
              ) : null}

              {step === 4 ? (
                <Card style={styles.panel}>
                  <Text style={styles.stepTitle}>When did your last period start?</Text>
                  <Text style={styles.stepCopy}>Use this to place your first cycle on the calendar.</Text>
                  <Text style={styles.inputLabel}>Last period started</Text>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                    onChangeText={(value) => {
                      setError("");
                      setLastPeriodStart(value);
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.inkMuted}
                    style={styles.input}
                    value={lastPeriodStart}
                  />
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                </Card>
              ) : null}

              {step === 5 ? (
                <Card style={styles.panel}>
                  <Text style={styles.stepTitle}>Want a daily BloomMate note?</Text>
                  <Text style={styles.stepCopy}>BloomMate can send a small compliment or quote at your chosen time.</Text>
                  <View style={styles.choiceRow}>
                    <AnimatedPressable
                      onPress={() => setNotificationsEnabled(true)}
                      style={[styles.choiceButton, notificationsEnabled && styles.choiceButtonActive]}
                    >
                      <Ionicons color={notificationsEnabled ? colors.surface : colors.berry} name="notifications-outline" size={22} />
                      <Text style={[styles.choiceText, notificationsEnabled && styles.choiceTextActive]}>Enable</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                      onPress={() => setNotificationsEnabled(false)}
                      style={[styles.choiceButton, !notificationsEnabled && styles.choiceButtonActive]}
                    >
                      <Ionicons color={!notificationsEnabled ? colors.surface : colors.berry} name="moon-outline" size={22} />
                      <Text style={[styles.choiceText, !notificationsEnabled && styles.choiceTextActive]}>Not now</Text>
                    </AnimatedPressable>
                  </View>

                  {notificationsEnabled ? (
                    <View style={styles.notificationPanel}>
                      <View style={styles.preferredTimeRow}>
                        <Text style={styles.inputLabel}>Preferred Time</Text>
                        <View style={styles.preferredTimeValue}>
                          <Text style={styles.preferredTimeText}>{formatCompactTime(notificationHour, notificationMinute)}</Text>
                          <Ionicons name="time-outline" size={18} color={colors.ink} />
                        </View>
                      </View>
                      <TimeWheelPicker
                        hour={notificationHour}
                        minute={notificationMinute}
                        onChange={(hour, minute) => {
                          setNotificationHour(hour);
                          setNotificationMinute(minute);
                        }}
                      />
                    </View>
                  ) : null}
                </Card>
              ) : null}
            </AnimatedStep>
          </ScrollView>

          <View style={styles.footer}>
            {step > 0 ? (
              <AnimatedPressable onPress={() => setStep((value) => value - 1)} style={styles.backButton}>
                <Text style={styles.backLabel}>Back</Text>
              </AnimatedPressable>
            ) : (
              <View style={styles.backButton} />
            )}
            <PrimaryButton label={isFinalStep ? "Start tracking" : "Next"} onPress={goNext} style={styles.nextButton} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProgressDot({ active, current }: { active: boolean; current: boolean }) {
  return <View style={[styles.progressDot, active && styles.progressDotActive, current && styles.progressDotCurrent]} />;
}

type StepperProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
};

function Stepper({ icon, label, value, onMinus, onPlus }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <View style={styles.stepperLabelRow}>
        <View style={styles.iconBubble}>
          <Ionicons color={colors.berry} name={icon} size={18} />
        </View>
        <View style={styles.stepperText}>
          <Text style={styles.inputLabel}>{label}</Text>
          <Text style={styles.stepperValue}>{value}</Text>
        </View>
      </View>
      <View style={styles.stepperButtons}>
        <PrimaryButton label="-" onPress={onMinus} variant="outline" style={styles.smallButton} />
        <PrimaryButton label="+" onPress={onPlus} variant="soft" style={styles.smallButton} />
      </View>
    </View>
  );
}

function TimeWheelPicker({
  hour,
  minute,
  onChange
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}) {
  const display = toDisplayTime(hour);
  const safeMinute = Math.min(55, Math.max(0, Math.round(minute / 5) * 5));

  return (
    <View style={styles.timeWheel}>
      <TimeWheelColumn
        items={HOURS.map((value) => ({ label: String(value), value }))}
        onSelect={(nextHour) => onChange(toTwentyFourHour(nextHour, display.period), safeMinute)}
        selectedValue={display.hour}
      />
      <TimeWheelColumn
        items={MINUTES.map((value) => ({ label: value.toString().padStart(2, "0"), value }))}
        onSelect={(nextMinute) => onChange(hour, nextMinute)}
        selectedValue={safeMinute}
      />
      <TimeWheelColumn
        items={PERIODS.map((value) => ({ label: value, value }))}
        onSelect={(nextPeriod) => onChange(toTwentyFourHour(display.hour, nextPeriod), safeMinute)}
        selectedValue={display.period}
      />
    </View>
  );
}

function TimeWheelColumn<T extends number | string>({
  items,
  onSelect,
  selectedValue
}: {
  items: { label: string; value: T }[];
  onSelect: (value: T) => void;
  selectedValue: T;
}) {
  return (
    <ScrollView contentContainerStyle={styles.timeColumnContent} showsVerticalScrollIndicator={false} style={styles.timeColumn}>
      {items.map((item) => {
        const selected = item.value === selectedValue;
        return (
          <AnimatedPressable
            key={String(item.value)}
            onPress={() => onSelect(item.value)}
            style={[styles.timeOption, selected && styles.timeOptionSelected]}
          >
            <Text style={[styles.timeOptionText, selected && styles.timeOptionTextSelected]}>{item.label}</Text>
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

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 88
  },
  choiceButton: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 92,
    padding: spacing.md
  },
  choiceButtonActive: {
    backgroundColor: colors.berry,
    borderColor: colors.berry
  },
  choiceRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  choiceText: {
    color: colors.berryDark,
    fontSize: 15,
    fontWeight: "900"
  },
  choiceTextActive: {
    color: colors.surface
  },
  backLabel: {
    color: colors.berry,
    fontSize: 15,
    fontWeight: "900"
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  copy: {
    color: colors.inkMuted,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
    textAlign: "center"
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: spacing.sm
  },
  flex: {
    flex: 1
  },
  footer: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  hero: {
    alignItems: "center"
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: colors.petal,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  image: {
    borderRadius: radii.lg,
    height: 220,
    marginBottom: spacing.md,
    maxHeight: 240,
    maxWidth: "78%",
    width: 220
  },
  input: {
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  kicker: {
    color: colors.berry,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  nextButton: {
    flex: 1
  },
  panel: {
    gap: spacing.md
  },
  progressDot: {
    backgroundColor: colors.line,
    borderRadius: 5,
    flex: 1,
    height: 8
  },
  progressDotActive: {
    backgroundColor: colors.berry
  },
  progressDotCurrent: {
    opacity: 0.92
  },
  progressRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  shell: {
    flex: 1
  },
  smallButton: {
    minHeight: 42,
    width: 56
  },
  stepCopy: {
    color: colors.inkMuted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22
  },
  stepper: {
    backgroundColor: "#FFF4E8",
    borderRadius: radii.md,
    gap: spacing.md,
    padding: spacing.md
  },
  stepperButtons: {
    flexDirection: "row",
    gap: spacing.sm
  },
  stepperLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  stepperText: {
    flex: 1
  },
  stepperValue: {
    color: colors.berry,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 2
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900"
  },
  notificationPanel: {
    backgroundColor: "#FFF4E8",
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.md
  },
  preferredTimeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44
  },
  preferredTimeText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  preferredTimeValue: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  timeColumn: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    maxHeight: 132
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
    justifyContent: "center",
    minHeight: 40
  },
  timeOptionSelected: {
    backgroundColor: colors.berry,
    borderColor: colors.berry
  },
  timeOptionText: {
    color: colors.inkMuted,
    fontSize: 16,
    fontWeight: "900"
  },
  timeOptionTextSelected: {
    color: colors.surface
  },
  timeWheel: {
    flexDirection: "row",
    gap: spacing.sm
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900",
    marginVertical: spacing.sm,
    textAlign: "center"
  }
});
