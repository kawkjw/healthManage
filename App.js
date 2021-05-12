import React, { useEffect, useState } from "react";
import Auth from "./screens/Auth";
import "./config/fixtimer";
import * as Notifications from "expo-notifications";
import { SafeAreaView, Text, TextInput } from "react-native";
import * as Updates from "expo-updates";
import { TextSize } from "./css/MyStyles";
import { Provider as PaperProvider } from "react-native-paper";
import { theme } from "./css/MyStyles";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

SplashScreen.preventAutoHideAsync().catch((error) => {
    console.log(error);
});

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

(async () => {
    await Font.loadAsync({
        NanumFontR: require("./assets/fonts/NanumSquareRoundR.ttf"),
        NanumFontB: require("./assets/fonts/NanumSquareRoundB.ttf"),
    });
})();

export default function App() {
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.allowFontScaling = false;
    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.allowFontScaling = false;

    const [showUpdates, setShowUpdates] = useState(false);
    useEffect(() => {
        Updates.checkForUpdateAsync().then((update) => {
            if (update.isAvailable) {
                setShowUpdates(true);
                SplashScreen.hideAsync().then((value) => {
                    console.log(value);
                    Updates.fetchUpdateAsync().then(async () => {
                        await Updates.reloadAsync();
                    });
                });
            }
        });
    }, []);

    return (
        <>
            {showUpdates ? (
                <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={TextSize.largerSize}>업데이트 중 입니다.</Text>
                    <Text style={TextSize.largerSize}>업데이트 완료 후 어플이 재실행되니</Text>
                    <Text style={TextSize.largerSize}>잠시만 기다려주세요.</Text>
                </SafeAreaView>
            ) : (
                <PaperProvider theme={theme}>
                    <Auth />
                </PaperProvider>
            )}
        </>
    );
}
