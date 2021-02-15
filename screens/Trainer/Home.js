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
import { RFPercentage } from "react-native-responsive-fontsize";

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

    const goMyClass = async () => {
        const { className } = (await db.collection("users").doc(uid).get()).data();
        if (className === "Need to Set Up") {
            Alert.alert("경고", "담당 과목 설정이 안되어 있습니다.\n내 정보에서 설정해주세요.", [
                {
                    text: "확인",
                    onPress: () => navigation.navigate("Profile", { showModal: true }),
                },
            ]);
        } else if (className.split(".")[0] === "pt") {
            navigation.navigate("PT", { limit: className.split(".").slice(1) });
        } else if (className.split(".")[0] === "gx") {
            navigation.navigate("GX", {
                className: className.split(".").slice(1),
            });
        }
    };

    return (
        <SafeAreaView style={MyStyles.container}>
            <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />
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
                    <Text style={{ fontSize: RFPercentage(2.3) }}>내 정보</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goMyClass()}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>수업 정보</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
