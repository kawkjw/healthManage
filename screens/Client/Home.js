import React, { useEffect } from "react";
import {
    Image,
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    Linking,
    StatusBar,
} from "react-native";
import { MyStyles, TextSize } from "../../css/MyStyles";
import * as Notifications from "expo-notifications";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Surface } from "react-native-paper";

export default Home = ({ navigation, route }) => {
    useEffect(() => {
        (async () => {
            await Notifications.getAllScheduledNotificationsAsync().then((notis) => {
                console.log(notis);
            });
        })();
        const notificationSubscription = Notifications.addNotificationReceivedListener(
            async (notification) => {
                let badge = await Notifications.getBadgeCountAsync();
                await Notifications.setBadgeCountAsync(badge + 1);
            }
        );
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(
            async (response) => {
                const {
                    notification: {
                        request: {
                            content: { data },
                        },
                    },
                } = response;
                if (data.navigation) {
                    if (data.datas) {
                        const { datas } = data;
                        navigation.reset({
                            index: 1,
                            routes: [
                                { name: "HomeScreen" },
                                { name: data.navigation, params: datas },
                            ],
                        });
                    } else {
                        navigation.reset({
                            index: 1,
                            routes: [{ name: "HomeScreen" }, { name: data.navigation }],
                        });
                    }
                }
                await Notifications.setBadgeCountAsync(0);
            }
        );
        return () => {
            Notifications.removeNotificationSubscription(notificationSubscription);
            Notifications.removeNotificationSubscription(responseSubscription);
        };
    }, []);

    return (
        <SafeAreaView style={[MyStyles.container, { justifyContent: "center" }]}>
            <StatusBar barStyle="light-content" />
            <View style={{ alignItems: "center" }}>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menuRatio1}
                        onPress={() => navigation.navigate("Profile")}
                    >
                        <Image
                            style={[MyStyles.image, { width: wp("80%"), aspectRatio: 1 }]}
                            source={{
                                uri: "https://reactnative.dev/img/tiny_logo.png",
                            }}
                        />
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("Menu")}
                    >
                        <Text style={TextSize.largeSize}>메뉴</Text>
                    </TouchableOpacity>
                </Surface>

                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => {
                            Linking.openURL("tel:12345678");
                        }}
                    >
                        <Text style={TextSize.largeSize}>전화 연결</Text>
                    </TouchableOpacity>
                </Surface>
            </View>
        </SafeAreaView>
    );
};
