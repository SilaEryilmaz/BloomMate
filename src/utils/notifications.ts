import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { pickNotificationMessage } from "../content/notificationMessages";
import { TrackerSettings } from "../types";

const BLOOM_CHANNEL_ID = "bloom-daily";
const ROLLING_NOTIFICATION_DAYS = 14;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export const configureNotifications = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(BLOOM_CHANNEL_ID, {
      name: "Daily BloomMate",
      importance: Notifications.AndroidImportance.DEFAULT,
      description: "Daily compliments and uplifting quotes from BloomMate."
    });
  }
};

export const hasNotificationPermission = async () => {
  const permission = await Notifications.getPermissionsAsync();
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
};

export const requestNotificationPermission = async () => {
  const permission = await Notifications.requestPermissionsAsync();
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
};

export const cancelBloomNotifications = async (notificationIds: string[]) => {
  await Promise.all(
    notificationIds.map(async (id) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // A stale local ID should not block disabling or rescheduling notifications.
      }
    })
  );
};

export const refreshBloomNotifications = async (settings: TrackerSettings, options: { requestPermission?: boolean } = {}) => {
  await configureNotifications();
  await cancelBloomNotifications(settings.notificationIds);

  if (!settings.notificationsEnabled) {
    return { ...settings, notificationIds: [] };
  }

  const allowed = options.requestPermission ? await requestNotificationPermission() : await hasNotificationPermission();
  if (!allowed) {
    return { ...settings, notificationsEnabled: false, notificationIds: [] };
  }

  const firstNotification = getNextNotificationDate(settings.notificationHour, settings.notificationMinute);
  const scheduledIds: string[] = [];

  try {
    for (let dayOffset = 0; dayOffset < ROLLING_NOTIFICATION_DAYS; dayOffset += 1) {
      const trigger = new Date(firstNotification);
      trigger.setDate(firstNotification.getDate() + dayOffset);
      const message = pickNotificationMessage(dayOffset + firstNotification.getDate());
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "A little BloomMate for you",
          body: message.text,
          data: { source: "bloom-daily", messageId: message.id }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
          channelId: Platform.OS === "android" ? BLOOM_CHANNEL_ID : undefined
        }
      });
      scheduledIds.push(id);
    }
  } catch {
    await cancelBloomNotifications(scheduledIds);
    return { ...settings, notificationsEnabled: false, notificationIds: [] };
  }

  return { ...settings, notificationIds: scheduledIds };
};

export const formatNotificationTime = (hour: number, minute: number) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const getNextNotificationDate = (hour: number, minute: number) => {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
};
