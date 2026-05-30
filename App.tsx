import "react-native-gesture-handler";

import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedEntrance } from "./src/components/AnimatedEntrance";
import { CalendarScreen } from "./src/screens/CalendarScreen";
import { HamburgerMenu } from "./src/components/HamburgerMenu";
import { LogsScreen } from "./src/screens/LogsScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { OpeningScreen } from "./src/screens/OpeningScreen";
import { DEFAULT_SETTINGS, initDatabase, loadTrackerData } from "./src/data/storage";
import { mergeRecentFactIds, pickOpeningFacts } from "./src/content/openingFacts";
import { saveSettings } from "./src/data/storage";
import { ScreenProps, TrackerData } from "./src/types";
import { colors, ThemeProvider, useTheme } from "./src/theme";
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

  const refreshData = async () => {
    const nextData = await loadTrackerData();
    setData(nextData);
  };

  useEffect(() => {
    const boot = async () => {
      try {
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
      } catch (error) {
        console.warn("BloomMate boot recovered with default settings", error);
        setData({ cycles: [], logs: [], settings: DEFAULT_SETTINGS });
        setOpeningFacts(pickOpeningFacts(DEFAULT_SETTINGS.recentFactIds));
      } finally {
        setReady(true);
      }
    };

    boot();
  }, []);

  const screenProps = useMemo(() => ({ data, refreshData }), [data]);
  const openMenu = () => {
    setMenuVisible(true);
  };
  const resetLocalAppState = () => {
    setSelectedLogDate(null);
    setMenuVisible(false);
    setOpeningComplete(false);
    setData({ cycles: [], logs: [], settings: DEFAULT_SETTINGS });
  };

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.canvas }]}>
        <AnimatedEntrance>
          <ActivityIndicator color={colors.berry} size="large" />
        </AnimatedEntrance>
      </View>
    );
  }

  if (!openingComplete) {
    return (
      <SafeAreaProvider>
        <ThemeProvider preset={data.settings.themePreset}>
          <StatusBar style="dark" />
          <OpeningScreen displayName={data.settings.displayName} facts={openingFacts} onComplete={() => setOpeningComplete(true)} />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {!data.settings.onboardingComplete ? (
        <ThemeProvider preset={data.settings.themePreset}>
          <StatusBar style="dark" />
          <OnboardingScreen refreshData={refreshData} />
        </ThemeProvider>
      ) : (
      <ThemeProvider preset={data.settings.themePreset}>
        <ThemedTabs
          data={data}
          menuVisible={menuVisible}
          openMenu={openMenu}
          refreshData={refreshData}
          screenProps={screenProps}
          selectedLogDate={selectedLogDate}
          setMenuVisible={setMenuVisible}
          setSelectedLogDate={setSelectedLogDate}
          onReset={resetLocalAppState}
        />
      </ThemeProvider>
      )}
    </SafeAreaProvider>
  );
}

function ThemedTabs({
  data,
  menuVisible,
  openMenu,
  refreshData,
  screenProps,
  selectedLogDate,
  setMenuVisible,
  setSelectedLogDate,
  onReset
}: {
  data: TrackerData;
  menuVisible: boolean;
  openMenu: () => void;
  refreshData: () => Promise<void>;
  screenProps: ScreenProps;
  selectedLogDate: string | null;
  setMenuVisible: (visible: boolean) => void;
  setSelectedLogDate: (date: string | null) => void;
  onReset: () => void;
}) {
  const theme = useTheme();

  return (
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: theme.accent,
            tabBarInactiveTintColor: theme.inkMuted,
            tabBarStyle: [styles.tabBar, { backgroundColor: `${theme.petal}F5`, borderTopColor: theme.line }],
            tabBarLabelStyle: styles.tabLabel,
            tabBarIcon: ({ color, size }) => {
              const icons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
                Home: "home-outline",
                Calendar: "calendar-outline",
                Logs: "document-text-outline"
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
                onBackPress={() => navigation.navigate("Home")}
                openMenu={openMenu}
                openLogDate={(date) => {
                  setSelectedLogDate(date);
                  navigation.navigate("Logs");
                }}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Logs">
            {({ navigation }) => (
              <LogsScreen
                {...screenProps}
                onBackPress={() => navigation.navigate("Home")}
                selectedDate={selectedLogDate}
                openMenu={openMenu}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
        <HamburgerMenu
          data={data}
          onClose={() => setMenuVisible(false)}
          onReset={onReset}
          refreshData={refreshData}
          visible={menuVisible}
        />
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  tabBar: {
    borderTopWidth: 1,
    height: 76,
    paddingBottom: 12,
    paddingTop: 8
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "900"
  }
});
