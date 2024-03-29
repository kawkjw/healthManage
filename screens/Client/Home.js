import React, { useEffect } from "react";
import { Image, View, TouchableOpacity, Linking, StatusBar, Dimensions } from "react-native";
import { MyStyles, TextSize, theme } from "../../css/MyStyles";
import * as Notifications from "expo-notifications";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Surface, Text } from "react-native-paper";

export default Home = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    useEffect(() => {
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
        <View style={MyStyles.container}>
            <StatusBar barStyle="light-content" />
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menuRatio1}
                        onPress={() => navigation.navigate("Profile")}
                    >
                        <Image
                            style={[
                                MyStyles.image,
                                width >= 800
                                    ? { width: wp("65%"), height: wp("65%") }
                                    : width >= 550
                                    ? { width: wp("70%"), height: wp("70%") }
                                    : { width: wp("90%"), height: wp("90%") },
                                { borderRadius: 20 },
                            ]}
                            source={require("../../assets/profile.png")}
                        />
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={[
                            MyStyles.menu,
                            width >= 800
                                ? { width: wp("65%") }
                                : width >= 550
                                ? { width: wp("70%") }
                                : undefined,
                        ]}
                        onPress={() => navigation.navigate("Menu")}
                    >
                        <Text style={TextSize.largeSize}>메뉴</Text>
                    </TouchableOpacity>
                </Surface>

                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={[
                            MyStyles.menu,
                            width >= 800
                                ? { width: wp("65%") }
                                : width >= 550
                                ? { width: wp("70%") }
                                : undefined,
                        ]}
                        onPress={() => {
                            Linking.openURL("tel:0313744554");
                        }}
                    >
                        <Text style={TextSize.largeSize}>전화 연결</Text>
                    </TouchableOpacity>
                </Surface>
            </View>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
