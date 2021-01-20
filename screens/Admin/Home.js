import React, { useEffect } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Platform,
    ScrollView,
    Alert,
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

    const goMyClass = async () => {
        const { className } = (
            await db.collection("users").doc(uid).get()
        ).data();
        if (className === "Need to Set Up") {
            Alert.alert("Error", "Need to set up your class");
        } else if (className.split(".")[0] === "pt") {
            navigation.navigate("PT");
        } else if (className.split(".")[0] === "gx") {
            navigation.navigate("GX", {
                className: className.split(".").slice(1),
            });
        }
    };

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
                    onPress={() => navigation.navigate("Calendar")}
                >
                    <Text>Calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("WeekCalendar")}
                >
                    <Text>Week Calendar</Text>
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
                    onPress={() => navigation.navigate("GetData")}
                >
                    <Text>Get Data</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("FindUser")}
                >
                    <Text>Manage User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goMyClass()}
                >
                    <Text>Class Info</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
