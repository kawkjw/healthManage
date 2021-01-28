import React from "react";
import Auth from "./screens/Auth";
import "./config/fixtimer";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export default function App({ navigation, route }) {
    return <Auth />;
}
