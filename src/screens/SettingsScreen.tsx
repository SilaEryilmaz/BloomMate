import { Alert, ScrollView, Share, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { deleteAllData } from "../data/storage";
import { colors, spacing } from "../theme";
import { ScreenProps } from "../types";

export function SettingsScreen({ data, refreshData }: ScreenProps) {
  const exportData = async () => {
    await Share.share({
      title: "Bloom cycle data",
      message: JSON.stringify(data, null, 2)
    });
  };

  const confirmDelete = () => {
    Alert.alert("Delete all data?", "This clears all cycles, logs, symptoms, and notes from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteAllData();
          await refreshData();
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Card>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <Text style={styles.copy}>Your data stays on this phone in Bloom v1. There is no account, cloud sync, or tracking server.</Text>
          <PrimaryButton label="Export my data" onPress={exportData} variant="soft" />
        </Card>
        <Card>
          <Text style={styles.sectionTitle}>Cycle defaults</Text>
          <Text style={styles.copy}>
            Predictions use your recent cycle history. Your starting defaults are a {data.settings.cycleLength}-day cycle and a{" "}
            {data.settings.periodLength}-day period.
          </Text>
        </Card>
        <Card>
          <Text style={styles.sectionTitle}>Reset</Text>
          <Text style={styles.copy}>Clear all locally stored cycle dates, daily logs, notes, symptoms, and flow levels.</Text>
          <PrimaryButton label="Delete all data" onPress={confirmDelete} variant="danger" />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: 112
  },
  copy: {
    color: colors.inkMuted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: spacing.md
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: spacing.sm
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "900"
  }
});
