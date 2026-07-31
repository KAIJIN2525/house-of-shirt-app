import { create } from "zustand";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationState {
  expoPushToken: string | undefined;
  notification: Notifications.Notification | undefined;
  setExpoPushToken: (token: string | undefined) => void;
  setNotification: (notification: Notifications.Notification | undefined) => void;
  sendLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  expoPushToken: undefined,
  notification: undefined,
  setExpoPushToken: (token) => set({ expoPushToken: token }),
  setNotification: (notification) => set({ notification }),
  sendLocalNotification: async (title, body, data) => {
    if (Platform.OS === 'android') {
      const check = await Notifications.getPermissionsAsync();
      if (check.status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== 'granted') return;
      }
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  },
}));

export const registerForPushNotificationsAsync = async () => {
  let token;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return;
    }
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.log("Error fetching push token:", e);
    }
  }
  return token;
};
