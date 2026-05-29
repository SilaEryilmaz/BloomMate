import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { deleteAllData, saveSettings } from "../data/storage";
import { colors, spacing } from "../theme";
import { TrackerData } from "../types";
import { cancelBloomNotifications, formatNotificationTime, refreshBloomNotifications } from "../utils/notifications";
import { Card } from "./Card";
import { PrimaryButton } from "./PrimaryButton";

type MenuView = "profile" | "settings";

type Props = {
  data: TrackerData;
  visible: boolean;
  initialView: MenuView;
  onClose: () => void;
  refreshData: () => Promise<void>;
};

export function HamburgerMenu({ data, visible, initialView, onClose, refreshData }: Props) {
  const [view, setView] = useState<MenuView>(initialView);
  const [cycleLength, setCycleLength] = useState(data.settings.cycleLength);
  const [notificationsEnabled, setNotificationsEnabled] = useState(data.settings.notificationsEnabled);
  const [notificationHour, setNotificationHour] = useState(data.settings.notificationHour);
  const [notificationMinute, setNotificationMinute] = useState(data.settings.notificationMinute);
  const [saved, setSaved] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");

  useEffect(() => {
    if (visible) {
      setView(initialView);
      setCycleLength(data.settings.cycleLength);
      setNotificationsEnabled(data.settings.notificationsEnabled);
      setNotificationHour(data.settings.notificationHour);
      setNotificationMinute(data.settings.notificationMinute);
      setSaved(false);
      setPermissionMessage("");
    }
  }, [
    data.settings.cycleLength,
    data.settings.notificationHour,
    data.settings.notificationMinute,
    data.settings.notificationsEnabled,
    initialView,
    visible
  ]);

  const exportData = async () => {
    await Share.share({
      title: "BloomMate cycle data",
      message: JSON.stringify(data, null, 2)
    });
  };

  const confirmDelete = () => {
    Alert.alert("Delete all data?", "This clears all cycles, logs, symptoms, notes, and settings from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await cancelBloomNotifications(data.settings.notificationIds);
          await deleteAllData();
          await refreshData();
          onClose();
        }
      }
    ]);
  };

  const adjustCycle = (amount: number) => {
    setSaved(false);
    setCycleLength((value) => Math.min(45, Math.max(18, value + amount)));
  };

  const adjustHour = (amount: number) => {
    setSaved(false);
    setNotificationHour((value) => (value + amount + 24) % 24);
  };

  const adjustMinute = (amount: number) => {
    setSaved(false);
    setNotificationMinute((value) => (value + amount + 60) % 60);
  };

  const persistSettings = async () => {
    setPermissionMessage("");
    let nextSettings = {
      ...data.settings,
      cycleLength,
      notificationHour,
      notificationMinute,
      notificationsEnabled
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

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.drawer}>
          <View style={styles.header}>
            <Text style={styles.title}>{view === "profile" ? "Profile" : "Settings"}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" color={colors.ink} size={24} />
            </Pressable>
          </View>

          <View style={styles.switcher}>
            <Pressable onPress={() => setView("profile")} style={[styles.switchButton, view === "profile" && styles.switchActive]}>
              <Text style={[styles.switchText, view === "profile" && styles.switchTextActive]}>Profile</Text>
            </Pressable>
            <Pressable onPress={() => setView("settings")} style={[styles.switchButton, view === "settings" && styles.switchActive]}>
              <Text style={[styles.switchText, view === "settings" && styles.switchTextActive]}>Settings</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {view === "profile" ? (
              <>
              <View style={styles.profileHeader}>
                <Image source={require("../../assets/bloom-mascot.png")} style={styles.avatar} />
                <Text style={styles.name}>{data.settings.displayName || "BloomMate Profile"}</Text>
                <Text style={styles.goal}>Goal: Cycle tracking</Text>
              </View>
              <View style={styles.statsRow}>
                <Card style={styles.statCard}>
                  <Text style={styles.statTitle}>Period length</Text>
                  <Text style={styles.statNumber}>{data.settings.periodLength}<Text style={styles.statUnit}> days</Text></Text>
                </Card>
                <Card style={styles.statCard}>
                  <Text style={styles.statTitle}>Cycle length</Text>
                  <Text style={[styles.statNumber, styles.blueNumber]}>{data.settings.cycleLength}<Text style={styles.statUnit}> days</Text></Text>
                </Card>
              </View>
              </>
            ) : (
              <>
              <Card style={styles.settingCard}>
                <Text style={styles.sectionTitle}>Cycle length</Text>
                <Text style={styles.copy}>Adjust your usual cycle length. BloomMate uses this for period and fertility predictions.</Text>
                <View style={styles.stepper}>
                  <PrimaryButton label="-" onPress={() => adjustCycle(-1)} variant="outline" style={styles.stepButton} />
                  <Text style={styles.stepValue}>{cycleLength} days</Text>
                  <PrimaryButton label="+" onPress={() => adjustCycle(1)} variant="soft" style={styles.stepButton} />
                </View>
              </Card>
              <Card style={styles.settingCard}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <Text style={styles.copy}>Get a daily compliment or quote from BloomMate. Messages are curated in the app and cannot be edited here.</Text>
                <View style={styles.choiceRow}>
                  <Pressable
                    onPress={() => {
                      setSaved(false);
                      setNotificationsEnabled(true);
                    }}
                    style={[styles.choiceButton, notificationsEnabled && styles.choiceButtonActive]}
                  >
                    <Ionicons color={notificationsEnabled ? colors.surface : colors.berry} name="notifications-outline" size={20} />
                    <Text style={[styles.choiceText, notificationsEnabled && styles.choiceTextActive]}>On</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setSaved(false);
                      setNotificationsEnabled(false);
                    }}
                    style={[styles.choiceButton, !notificationsEnabled && styles.choiceButtonActive]}
                  >
                    <Ionicons color={!notificationsEnabled ? colors.surface : colors.berry} name="notifications-off-outline" size={20} />
                    <Text style={[styles.choiceText, !notificationsEnabled && styles.choiceTextActive]}>Off</Text>
                  </Pressable>
                </View>
                {notificationsEnabled ? (
                  <View style={styles.timePanel}>
                    <Text style={styles.statTitle}>Daily time</Text>
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
                {permissionMessage ? <Text style={styles.permission}>{permissionMessage}</Text> : null}
                {saved ? <Text style={styles.saved}>Settings saved.</Text> : null}
                <PrimaryButton label="Save settings" onPress={persistSettings} />
              </Card>
              <Card style={styles.settingCard}>
                <Text style={styles.sectionTitle}>Privacy</Text>
                <Text style={styles.copy}>Your data stays on this phone in BloomMate v1. There is no account, cloud sync, or tracking server.</Text>
                <PrimaryButton label="Export data" onPress={exportData} variant="soft" />
              </Card>
              </>
            )}
          </ScrollView>

          <View style={styles.menuActions}>
            <PrimaryButton label="Export data" onPress={exportData} variant="outline" />
            <PrimaryButton label="Delete profile/data" onPress={confirmDelete} variant="danger" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 42,
    height: 84,
    width: 84
  },
  backdrop: {
    alignItems: "flex-end",
    backgroundColor: "rgba(45, 34, 48, 0.32)",
    flex: 1
  },
  blueNumber: {
    color: colors.sky
  },
  body: {
    gap: spacing.md
  },
  closeButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40
  },
  choiceButton: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 48
  },
  choiceButtonActive: {
    backgroundColor: colors.berry,
    borderColor: colors.berry
  },
  choiceRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  choiceText: {
    color: colors.berryDark,
    fontSize: 14,
    fontWeight: "900"
  },
  choiceTextActive: {
    color: colors.surface
  },
  copy: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: spacing.md
  },
  drawer: {
    backgroundColor: colors.canvas,
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: 58,
    width: "86%"
  },
  goal: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  menuActions: {
    gap: spacing.sm,
    marginTop: "auto"
  },
  name: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: spacing.sm
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: spacing.sm
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
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: spacing.xs
  },
  settingCard: {
    backgroundColor: colors.surface
  },
  statCard: {
    flex: 1
  },
  statNumber: {
    color: colors.coral,
    fontSize: 28,
    fontWeight: "900",
    marginTop: spacing.sm
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  statTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  statUnit: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  stepButton: {
    minHeight: 44,
    width: 54
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginBottom: spacing.md
  },
  stepValue: {
    color: colors.berry,
    fontSize: 26,
    fontWeight: "900",
    minWidth: 132,
    textAlign: "center"
  },
  switchActive: {
    backgroundColor: colors.berry
  },
  switchButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: spacing.sm
  },
  switcher: {
    backgroundColor: "#F5E7DF",
    borderRadius: 999,
    flexDirection: "row",
    padding: 4
  },
  switchText: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "900"
  },
  switchTextActive: {
    color: colors.surface
  },
  timeButton: {
    flex: 1,
    minHeight: 40
  },
  timeControls: {
    flexDirection: "row",
    gap: spacing.sm
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
    fontSize: 26,
    fontWeight: "900"
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900"
  }
});
