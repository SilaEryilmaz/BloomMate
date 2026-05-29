import { Ionicons } from "@expo/vector-icons";
import { format, isValid, parseISO, subDays } from "date-fns";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { saveOnboarding } from "../data/storage";
import { colors, radii, spacing } from "../theme";
import { TrackerSettings } from "../types";
import { formatNotificationTime, refreshBloomNotifications } from "../utils/notifications";

type Props = {
  refreshData: () => Promise<void>;
};

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
  const adjustHour = (amount: number) => setNotificationHour((value) => (value + amount + 24) % 24);
  const adjustMinute = (amount: number) => setNotificationMinute((value) => (value + amount + 60) % 60);

  const submit = async () => {
    const parsedDate = parseISO(lastPeriodStart);
    if (!isValid(parsedDate)) {
      setError("Use a date like 2026-05-28.");
      return;
    }

    let nextSettings: TrackerSettings = {
      displayName: displayName.trim(),
      recentFactIds: [],
      notificationIds: [],
      periodLength,
      cycleLength,
      notificationHour,
      notificationMinute,
      notificationsEnabled,
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
              <View key={item} style={[styles.progressDot, item <= step && styles.progressDotActive]} />
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                  placeholder="Sila"
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
                  <Pressable
                    onPress={() => setNotificationsEnabled(true)}
                    style={[styles.choiceButton, notificationsEnabled && styles.choiceButtonActive]}
                  >
                    <Ionicons color={notificationsEnabled ? colors.surface : colors.berry} name="notifications-outline" size={22} />
                    <Text style={[styles.choiceText, notificationsEnabled && styles.choiceTextActive]}>Enable</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setNotificationsEnabled(false)}
                    style={[styles.choiceButton, !notificationsEnabled && styles.choiceButtonActive]}
                  >
                    <Ionicons color={!notificationsEnabled ? colors.surface : colors.berry} name="moon-outline" size={22} />
                    <Text style={[styles.choiceText, !notificationsEnabled && styles.choiceTextActive]}>Not now</Text>
                  </Pressable>
                </View>

                {notificationsEnabled ? (
                  <View style={styles.notificationPanel}>
                    <Text style={styles.inputLabel}>Daily time</Text>
                    <Text style={styles.timeValue}>{formatNotificationTime(notificationHour, notificationMinute)}</Text>
                    <View style={styles.timeControls}>
                      <PrimaryButton label="- hour" onPress={() => adjustHour(-1)} variant="outline" style={styles.timeButton} />
                      <PrimaryButton label="+ hour" onPress={() => adjustHour(1)} variant="soft" style={styles.timeButton} />
                    </View>
                    <View style={styles.timeControls}>
                      <PrimaryButton label="- 5 min" onPress={() => adjustMinute(-5)} variant="outline" style={styles.timeButton} />
                      <PrimaryButton label="+ 5 min" onPress={() => adjustMinute(5)} variant="soft" style={styles.timeButton} />
                    </View>
                  </View>
                ) : null}
              </Card>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {step > 0 ? (
              <Pressable onPress={() => setStep((value) => value - 1)} style={styles.backButton}>
                <Text style={styles.backLabel}>Back</Text>
              </Pressable>
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
  timeButton: {
    flex: 1,
    minHeight: 42
  },
  timeControls: {
    flexDirection: "row",
    gap: spacing.sm
  },
  timeValue: {
    color: colors.berry,
    fontSize: 30,
    fontWeight: "900"
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900",
    marginVertical: spacing.sm,
    textAlign: "center"
  }
});
