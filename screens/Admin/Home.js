import React, { useEffect } from "react";
import {
    SafeAreaView,
    Text,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Platform,
    ScrollView,
} from "react-native";
import { MyStyles } from "../../css/MyStyles";
import * as Notifications from "expo-notifications";
import myBase, { db } from "../../config/MyBase";

export default Home = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const uid = myBase.auth().currentUser.uid;

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
                        const { className } = (
                            await db.collection("users").doc(uid).get()
                        ).data();
                        if (data.navigation !== "PT") {
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
                                routes: [
                                    { name: "HomeScreen" },
                                    {
                                        name: "PT",
                                        params: {
                                            ...datas,
                                            limit: className
                                                .split(".")
                                                .slice(1),
                                        },
                                    },
                                ],
                            });
                        }
                    } else {
                        navigation.reset({
                            index: 1,
                            routes: [
                                { name: "HomeScreen" },
                                { name: data.navigation },
                            ],
                        });
                    }
                }
                await Notifications.setBadgeCountAsync(0);
            }
        );
        return () => {
            Notifications.removeNotificationSubscription(
                notificationSubscription
            );
            Notifications.removeNotificationSubscription(responseSubscription);
        };
    }, []);

    return (
        <SafeAreaView style={MyStyles.container}>
            <StatusBar
                barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
            />
            <ScrollView
                style={{ flex: 1, alignSelf: "stretch", paddingVertical: 10 }}
                contentContainerStyle={{ alignItems: "center" }}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Profile")}
                >
                    <Text>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => {}}
                >
                    <Text>Class Info</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Locker")}
                >
                    <Text>Locker</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("ClientInfoMenu")}
                >
                    <Text>Client Info Menu</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
