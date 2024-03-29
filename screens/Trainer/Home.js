import React, { useEffect, useState } from "react";
import { TouchableOpacity, StatusBar, View, Alert } from "react-native";
import { MyStyles, TextSize, theme } from "../../css/MyStyles";
import * as Notifications from "expo-notifications";
import myBase, { db } from "../../config/MyBase";
import { Surface, Text } from "react-native-paper";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default Home = ({ navigation, route }) => {
    const uid = myBase.auth().currentUser.uid;
    const [myClass, setMyClass] = useState("");

    const getMyClass = () => {
        const func = db
            .collection("users")
            .doc(uid)
            .onSnapshot(
                (doc) => {
                    setMyClass(doc.data().className);
                },
                (error) => {
                    func();
                }
            );
    };

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
                        if (data.navigation !== "PT") {
                            navigation.reset({
                                index: 1,
                                routes: [
                                    { name: "HomeScreen" },
                                    { name: data.navigation, params: datas },
                                ],
                            });
                        } else if (myClass.split(".")[0] === "pt") {
                            navigation.reset({
                                index: 1,
                                routes: [
                                    { name: "HomeScreen" },
                                    {
                                        name: "PT",
                                        params: {
                                            ...datas,
                                            ptName: "pt",
                                            limit: myClass.split(".").slice(1),
                                        },
                                    },
                                ],
                            });
                        } else if (myClass.split(".")[1] === "squash") {
                            navigation.reset({
                                index: 2,
                                routes: [
                                    { name: "HomeScreen" },
                                    {
                                        name: "SelectSquashKind",
                                        params: {
                                            limit: myClass.split(".").slice(2),
                                        },
                                    },
                                    {
                                        name: "PT",
                                        params: {
                                            ...datas,
                                            ptName: "squash",
                                            limit: myClass.split(".").slice(2),
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
        getMyClass();
        return () => {
            Notifications.removeNotificationSubscription(notificationSubscription);
            Notifications.removeNotificationSubscription(responseSubscription);
        };
    }, []);

    const goMyClass = async () => {
        if (myClass.split(".")[0] === "pt") {
            navigation.navigate("PT", { ptName: "pt", limit: myClass.split(".").slice(1) });
        } else if (myClass.split(".")[0] === "gx") {
            if (myClass.split(".")[1] === "squash") {
                navigation.navigate("SelectSquashKind", { limit: myClass.split(".").slice(2) });
            } else {
                navigation.navigate("GX", {
                    className: myClass.split(".").slice(1),
                });
            }
        } else {
            Alert.alert(
                "경고",
                "담당 과목 설정이 안되어 있습니다.\n내 정보에서 설정해주세요.",
                [
                    {
                        text: "확인",
                        onPress: () => navigation.navigate("Profile", { showModal: true }),
                    },
                ],
                { cancelable: false }
            );
        }
    };

    return (
        <View style={MyStyles.container}>
            <StatusBar barStyle="light-content" />
            <View style={{ flex: 1, marginTop: 10 }}>
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
                        onPress={() => navigation.navigate("Profile")}
                    >
                        <Text style={TextSize.largeSize}>내 정보</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity style={MyStyles.menu} onPress={() => goMyClass()}>
                        <Text style={TextSize.largeSize}>수업 정보</Text>
                    </TouchableOpacity>
                </Surface>
                {myClass.split(".")[0] === "pt" || myClass.split(".")[1] === "squash" ? (
                    <Surface style={MyStyles.surface}>
                        <TouchableOpacity
                            style={MyStyles.menu}
                            onPress={() =>
                                navigation.navigate("ClientInfo", { className: myClass })
                            }
                        >
                            <Text style={TextSize.largeSize}>고객 정보</Text>
                        </TouchableOpacity>
                    </Surface>
                ) : null}
            </View>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
