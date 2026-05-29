import "react-native-gesture-handler";

import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CalendarScreen } from "./src/screens/CalendarScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { DEFAULT_SETTINGS, initDatabase, loadTrackerData } from "./src/data/storage";
import { TrackerData } from "./src/types";
import { colors } from "./src/theme";

export type RootTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  const [data, setData] = useState<TrackerData>({ cycles: [], logs: [], settings: DEFAULT_SETTINGS });
  const [ready, setReady] = useState(false);

  const refreshData = async () => {
    const nextData = await loadTrackerData();
    setData(nextData);
  };

  useEffect(() => {
    const boot = async () => {
      await initDatabase();
      await refreshData();
      setReady(true);
    };

    boot();
  }, []);

  const screenProps = useMemo(() => ({ data, refreshData }), [data]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.berry} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {!data.settings.onboardingComplete ? (
        <>
          <StatusBar style="dark" />
          <OnboardingScreen refreshData={refreshData} />
        </>
      ) : (
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.berry,
            tabBarInactiveTintColor: colors.inkMuted,
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
            tabBarIcon: ({ color, size }) => {
              const icons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
                Home: "home",
                Calendar: "calendar-outline",
                Profile: "person"
              };
              return <Ionicons name={icons[route.name]} color={color} size={size} />;
            }
          })}
        >
          <Tab.Screen name="Home">{() => <TodayScreen {...screenProps} />}</Tab.Screen>
          <Tab.Screen name="Calendar">{() => <CalendarScreen {...screenProps} />}</Tab.Screen>
          <Tab.Screen name="Profile">{() => <SettingsScreen {...screenProps} />}</Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: "center"
  },
  tabBar: {
    backgroundColor: "#F7F1EC",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    height: 82,
    paddingBottom: 16,
    paddingTop: 10
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700"
  }
});
