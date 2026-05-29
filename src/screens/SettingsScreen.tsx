import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { TopBar } from "../components/TopBar";
import { deleteAllData } from "../data/storage";
import { colors, spacing } from "../theme";
import { ScreenProps } from "../types";

export function SettingsScreen({ data, refreshData }: ScreenProps) {
  const exportData = async () => {
    await Share.share({
      title: "BloomMate cycle data",
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
        <TopBar title="Profile" showBack />

        <View style={styles.profileHeader}>
          <Image source={require("../../assets/bloom-mascot.png")} style={styles.avatar} />
          <Text style={styles.name}>BloomMate Profile</Text>
          <Text style={styles.goal}>Goal: Cycle tracking</Text>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statTitle}>Period length</Text>
              <Ionicons name="water" color={colors.coral} size={22} />
            </View>
            <Text style={styles.statNumber}>{data.settings.periodLength}<Text style={styles.statUnit}> days</Text></Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statTitle}>Cycle length</Text>
              <Ionicons name="sync" color={colors.sky} size={22} />
            </View>
            <Text style={[styles.statNumber, styles.blueNumber]}>{data.settings.cycleLength}<Text style={styles.statUnit}> days</Text></Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>
        <Card style={styles.menuGrid}>
          <MenuItem icon="download-outline" label="Export data" onPress={exportData} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy" />
          <MenuItem icon="calendar-outline" label="Cycle defaults" />
          <MenuItem icon="document-text-outline" label="Health report" />
          <MenuItem icon="reader-outline" label="Terms" />
          <MenuItem danger icon="trash-outline" label="Delete profile" onPress={confirmDelete} />
        </Card>

        <Card>
          <Text style={styles.copy}>Your data stays on this phone in BloomMate v1. There is no account, cloud sync, or tracking server.</Text>
          <PrimaryButton label="Export my data" onPress={exportData} variant="soft" />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress, danger = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; danger?: boolean }) {
  return (
    <View style={styles.menuItem}>
      <PrimaryButton
        label=""
        onPress={onPress ?? (() => undefined)}
        variant={danger ? "danger" : "outline"}
        style={StyleSheet.flatten([styles.iconButton, !danger && styles.lightIconButton])}
      />
      <View pointerEvents="none" style={styles.iconOverlay}>
        <Ionicons name={icon} color={danger ? colors.surface : colors.ink} size={19} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: 112
  },
  avatar: {
    borderRadius: 38,
    height: 76,
    width: 76
  },
  blueNumber: {
    color: colors.sky
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
  goal: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  iconButton: {
    borderRadius: 22,
    height: 44,
    minHeight: 44,
    width: 44
  },
  iconOverlay: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    width: 44
  },
  lightIconButton: {
    backgroundColor: colors.surface,
    borderWidth: 0
  },
  menuGrid: {
    backgroundColor: "#F5F2EF",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.lg
  },
  menuItem: {
    alignItems: "center",
    position: "relative",
    width: "31%"
  },
  menuLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
    textAlign: "center"
  },
  name: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: spacing.sm
  },
  profileHeader: {
    alignItems: "center"
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: spacing.sm
  },
  statCard: {
    flex: 1
  },
  statNumber: {
    color: colors.coral,
    fontSize: 30,
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
  statTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  statUnit: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  }
});
