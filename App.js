import React, { useEffect } from "react";
import Auth from "./screens/Auth";
import "./config/fixtimer";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationAsync } from "./config/MyExpo";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App({ navigation, route }) {
  useEffect(() => {
    registerForPushNotificationAsync();
  }, []);
  return <Auth />;
}
