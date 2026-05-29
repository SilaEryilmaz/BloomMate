import "react-native-gesture-handler";

import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CalendarScreen } from "./src/screens/CalendarScreen";
import { HamburgerMenu } from "./src/components/HamburgerMenu";
import { LogsScreen } from "./src/screens/LogsScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { OpeningScreen } from "./src/screens/OpeningScreen";
import { DEFAULT_SETTINGS, initDatabase, loadTrackerData } from "./src/data/storage";
import { mergeRecentFactIds, pickOpeningFacts } from "./src/content/openingFacts";
import { saveSettings } from "./src/data/storage";
import { TrackerData } from "./src/types";
import { colors } from "./src/theme";
import { configureNotifications, refreshBloomNotifications } from "./src/utils/notifications";

export type RootTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Logs: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  const [data, setData] = useState<TrackerData>({ cycles: [], logs: [], settings: DEFAULT_SETTINGS });
  const [selectedLogDate, setSelectedLogDate] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [openingComplete, setOpeningComplete] = useState(false);
  const [openingFacts, setOpeningFacts] = useState(() => pickOpeningFacts(DEFAULT_SETTINGS.recentFactIds));
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuView, setMenuView] = useState<"profile" | "settings">("profile");

  const refreshData = async () => {
    const nextData = await loadTrackerData();
    setData(nextData);
  };

  useEffect(() => {
    const boot = async () => {
      await initDatabase();
      await configureNotifications();
      const nextData = await loadTrackerData();
      const selectedFacts = pickOpeningFacts(nextData.settings.recentFactIds);
      const recentFactIds = mergeRecentFactIds(nextData.settings.recentFactIds, selectedFacts.map((fact) => fact.id));
      let nextSettings = {
        ...nextData.settings,
        recentFactIds
      };

      if (nextSettings.onboardingComplete) {
        nextSettings = await refreshBloomNotifications(nextSettings);
      }

      setData({
        ...nextData,
        settings: nextSettings
      });
      setOpeningFacts(selectedFacts);
      await saveSettings(nextSettings);
      setReady(true);
    };

    boot();
  }, []);

  const screenProps = useMemo(() => ({ data, refreshData }), [data]);
  const openMenu = (view: "profile" | "settings" = "profile") => {
    setMenuView(view);
    setMenuVisible(true);
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.berry} size="large" />
      </View>
    );
  }

  if (!openingComplete) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <OpeningScreen displayName={data.settings.displayName} facts={openingFacts} onComplete={() => setOpeningComplete(true)} />
      </SafeAreaProvider>
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
                Logs: "add-circle"
              };
              return <Ionicons name={icons[route.name]} color={color} size={size} />;
            }
          })}
        >
          <Tab.Screen name="Home">{() => <TodayScreen {...screenProps} openMenu={openMenu} />}</Tab.Screen>
          <Tab.Screen name="Calendar">
            {({ navigation }) => (
              <CalendarScreen
                {...screenProps}
                openMenu={openMenu}
                openLogDate={(date) => {
                  setSelectedLogDate(date);
                  navigation.navigate("Logs");
                }}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Logs">{() => <LogsScreen {...screenProps} selectedDate={selectedLogDate} openMenu={openMenu} />}</Tab.Screen>
        </Tab.Navigator>
        <HamburgerMenu
          data={data}
          initialView={menuView}
          onClose={() => setMenuVisible(false)}
          refreshData={refreshData}
          visible={menuVisible}
        />
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
