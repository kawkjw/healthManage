import React, { useEffect } from "react";
import {
    Image,
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Linking,
    StatusBar,
    Platform,
} from "react-native";
import { MyStyles } from "../../css/MyStyles";
import * as Notifications from "expo-notifications";

export default Home = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const widthImage = widthButton - 60;

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

    return (
        <SafeAreaView style={MyStyles.container}>
            <StatusBar
                barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
            />
            <View style={{ flex: 1, justifyContent: "center" }}>
                <TouchableOpacity
                    style={[
                        MyStyles.profileButton,
                        MyStyles.buttonShadow,
                        {
                            width: widthButton,
                            marginBottom: 20,
                            justifyContent: "center",
                        },
                    ]}
                    onPress={() => navigation.navigate("Profile")}
                >
                    <Text>Profile</Text>
                    <Image
                        style={[MyStyles.image, { width: widthImage }]}
                        source={{
                            uri: "https://reactnative.dev/img/tiny_logo.png",
                        }}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Menu")}
                >
                    <Text>Menu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton },
                    ]}
                    onPress={() => {
                        Linking.openURL("tel:12345678");
                    }}
                >
                    <Text>전화 연결</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
