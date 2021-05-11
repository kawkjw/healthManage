import React, { useEffect } from "react";
import { SafeAreaView, TouchableOpacity, StatusBar, ScrollView } from "react-native";
import { MyStyles, TextSize } from "../../css/MyStyles";
import * as Notifications from "expo-notifications";
import myBase, { db } from "../../config/MyBase";
import { Text, Surface } from "react-native-paper";

export default Home = ({ navigation, route }) => {
    const uid = myBase.auth().currentUser !== null ? myBase.auth().currentUser.uid : null;

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
                        const { className } = (await db.collection("users").doc(uid).get()).data();
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
                                            limit: className.split(".").slice(1),
                                        },
                                    },
                                ],
                            });
                        }
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
        <SafeAreaView style={MyStyles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                style={{ flex: 1, alignSelf: "stretch", paddingVertical: 10 }}
                contentContainerStyle={{ alignItems: "center" }}
                showsVerticalScrollIndicator={false}
            >
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("GenQR")}
                    >
                        <Text style={TextSize.largeSize}>입장 코드 생성</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("ClassInfoMenu")}
                    >
                        <Text style={TextSize.largeSize}>수업 정보</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("Locker")}
                    >
                        <Text style={TextSize.largeSize}>락커</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("ClientInfoMenu")}
                    >
                        <Text style={TextSize.largeSize}>고객 정보</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("InputPassword", { to: "Sales" })}
                    >
                        <Text style={TextSize.largeSize}>결산</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("InputPassword", { to: "Calculate" })}
                    >
                        <Text style={TextSize.largeSize}>PT 정산</Text>
                    </TouchableOpacity>
                </Surface>
            </ScrollView>
        </SafeAreaView>
    );
};
