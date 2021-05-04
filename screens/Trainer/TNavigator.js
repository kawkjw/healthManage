import React, { useContext, useEffect, useState } from "react";
import { AppState, Linking, ScrollView, TouchableOpacity, View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./Home";
import Profile from "./Profile";
import { AuthContext } from "../Auth";
import GX from "./Class/GX";
import PT from "./Class/PT";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { MaterialIcons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import * as Notifications from "expo-notifications";
import myBase, { db } from "../../config/MyBase";
import SelectSquashKind from "./Class/SelectSquashKind";
import { TextFamily, TextSize, theme } from "../../css/MyStyles";
import { displayedAt, checkBatchimEnding } from "../../config/hooks";
import { Badge, Button, Card, Text } from "react-native-paper";
import ClientInfo from "./ClientInfo";

const Stack = createStackNavigator();
const MyStack = () => {
    const { signOut } = useContext(AuthContext);
    const uid = myBase.auth().currentUser !== null ? myBase.auth().currentUser.uid : "null";
    const [limit, setLimit] = useState([]);

    const [loading, setLoading] = useState(true);
    const [notificationAvail, setNotificationAvail] = useState(false);
    const [messages, setMessages] = useState([]);
    const [modalNotification, setModalNotification] = useState(false);
    const [unread, setUnread] = useState(false);
    const [notificationNum, setNotificationNum] = useState(0);
    const [unsubscribe, setUnsubscribe] = useState(() => {});

    const getPTLimit = async () => {
        await db
            .collection("users")
            .doc(uid)
            .get()
            .then((info) => {
                const { className } = info.data();
                setLimit(className.split(".").slice(1));
            });
    };

    const getNotifications = async () => {
        const today = new Date();
        const func = db
            .collection("notifications")
            .doc(uid)
            .collection("messages")
            .where(
                "sendDate",
                ">=",
                new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15)
            )
            .orderBy("sendDate", "desc")
            .onSnapshot(
                async (messages) => {
                    let list = [];
                    let num = 0;
                    messages.forEach((message) => {
                        const obj = message.data();
                        list.push({ id: message.id, ...obj });
                        if (!obj.isRead) {
                            num = num + 1;
                            setUnread(true);
                        }
                    });
                    if (num === 0) {
                        setUnread(false);
                    }
                    setMessages(list);
                    setNotificationNum(num);
                    await Notifications.setBadgeCountAsync(num);
                },
                (error) => {
                    console.log(error);
                    func();
                }
            );
        return func;
    };

    const checkNotification = async (id) => {
        await db
            .collection("notifications")
            .doc(uid)
            .collection("messages")
            .doc(id)
            .update({ isRead: true });
        let temp = messages;
        temp.find((d) => d.id === id).isRead = true;
        setMessages(temp);
        if (notificationNum - 1 === 0) {
            setUnread(false);
            setNotificationNum(0);
            await Notifications.setBadgeCountAsync(0);
        } else {
            await Notifications.setBadgeCountAsync(notificationNum - 1);
            setNotificationNum(notificationNum - 1);
        }
    };

    const checkAllNotification = async () => {
        let temp = messages;
        const needToCheck = messages.filter((m) => m.isRead === false);
        const promises = needToCheck.map(async (message) => {
            await db
                .collection("notifications")
                .doc(uid)
                .collection("messages")
                .doc(message.id)
                .update({ isRead: true });
            temp.find((m) => m.id === message.id).isRead = true;
        });
        await Promise.all(promises);
        setMessages(temp);
        setUnread(false);
        setNotificationNum(0);
        await Notifications.setBadgeCountAsync(0);
    };

    const execPromise = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === "granted") {
            setNotificationAvail(true);
        }
        await getPTLimit();
        await getNotifications().then((func) => {
            setUnsubscribe(func === undefined ? () => console.log : () => func);
            setLoading(false);
        });
    };

    const setPermissionNotification = async (state) => {
        if (state === "active") {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== "granted") {
                setUnread(false);
                setNotificationAvail(false);
            } else {
                setNotificationAvail(true);
                if (notificationNum > 0) {
                    setUnread(true);
                }
            }
        }
    };

    useEffect(() => {
        AppState.addEventListener("change", setPermissionNotification);
        execPromise();
        return () => {
            AppState.removeEventListener("change", setPermissionNotification);
        };
    }, []);

    const renderGoBackButton = (navigation) => (
        <TouchableOpacity
            style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                padding: 10,
                marginLeft: 7,
            }}
            onPress={() => navigation.goBack()}
        >
            <MaterialIcons name="arrow-back-ios" size={RFPercentage(2.5)} color="white" />
        </TouchableOpacity>
    );

    const renderNotificationButton = (navigation) =>
        loading ? undefined : (
            <View
                style={{
                    marginLeft: 10,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <TouchableOpacity
                    style={{ width: wp("8%") }}
                    onPress={() => {
                        if (notificationAvail) {
                            setModalNotification(true);
                        } else {
                            Linking.openSettings();
                        }
                    }}
                >
                    <Badge size={10} visible={unread} style={{ position: "absolute", right: 3 }} />
                    <MaterialIcons
                        name={notificationAvail ? "notifications" : "notifications-off"}
                        size={RFPercentage(3.5)}
                        color="white"
                    />
                </TouchableOpacity>
                <Modal
                    isVisible={modalNotification}
                    style={{
                        justifyContent: "flex-end",
                        margin: 0,
                    }}
                    onBackdropPress={() => setModalNotification(false)}
                    onBackButtonPress={() => setModalNotification(false)}
                >
                    <View
                        style={{
                            height: hp("80%"),
                            backgroundColor: "white",
                            paddingBottom: 60,
                        }}
                    >
                        <View
                            style={{ flexDirection: "row", backgroundColor: theme.colors.primary }}
                        >
                            <Button
                                mode="text"
                                compact={true}
                                labelStyle={[TextFamily.NanumBold, { padding: 4, color: "white" }]}
                                onPress={() => setModalNotification(false)}
                            >
                                닫기
                            </Button>
                            <Button
                                style={{
                                    position: "absolute",
                                    right: 0,
                                }}
                                onPress={() => {
                                    checkAllNotification();
                                    setModalNotification(false);
                                }}
                                compact={true}
                                labelStyle={[TextFamily.NanumBold, { padding: 4, color: "white" }]}
                            >
                                모두 읽음
                            </Button>
                        </View>
                        <View>
                            <View style={{ paddingLeft: 10, marginVertical: 3 }}>
                                <Text style={{ color: "#595959" }}>
                                    15일 전까지의 메시지만 보여집니다.
                                </Text>
                            </View>
                            {messages.length === 0 ? (
                                <View style={{ padding: 10 }}>
                                    <Text style={TextSize.largeSize}>알림 없음</Text>
                                </View>
                            ) : (
                                <ScrollView>
                                    {messages.map((message, index) => (
                                        <Card
                                            key={index}
                                            style={[
                                                message.isRead && { borderColor: "grey" },
                                                {
                                                    borderWidth: 1,
                                                    marginHorizontal: 10,
                                                    marginBottom: 10,
                                                    elevation: 5,
                                                },
                                            ]}
                                            onPress={() => {
                                                setModalNotification(false);
                                                if (!message.isRead) {
                                                    checkNotification(message.id);
                                                }
                                                if (message.data.navigation === "PT") {
                                                    if (limit[0] === "squash") {
                                                        navigation.reset({
                                                            index: 2,
                                                            routes: [
                                                                { name: "HomeScreen" },
                                                                {
                                                                    name: "SelectSquashKind",
                                                                    params: {
                                                                        limit: limit.slice(1),
                                                                    },
                                                                },
                                                                {
                                                                    name: "PT",
                                                                    params: {
                                                                        ...message.data.datas,
                                                                        ptName: "squash",
                                                                        limit: limit.slice(1),
                                                                    },
                                                                },
                                                            ],
                                                        });
                                                    } else {
                                                        navigation.navigate(
                                                            message.data.navigation,
                                                            {
                                                                ptName: "pt",
                                                                limit: limit,
                                                                ...message.data.datas,
                                                            }
                                                        );
                                                    }
                                                }
                                            }}
                                        >
                                            <Card.Content>
                                                <View style={{ flexDirection: "row" }}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text
                                                            style={
                                                                message.isRead && { color: "grey" }
                                                            }
                                                        >
                                                            {message.sendFrom +
                                                                (checkBatchimEnding(
                                                                    message.sendFrom
                                                                )
                                                                    ? " 으로부터"
                                                                    : " 로부터")}
                                                        </Text>
                                                    </View>
                                                    <View
                                                        style={{ flex: 1, alignItems: "flex-end" }}
                                                    >
                                                        <Text
                                                            style={
                                                                message.isRead && { color: "grey" }
                                                            }
                                                        >
                                                            {displayedAt(message.sendDate.toDate())}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ paddingLeft: 5 }}>
                                                    <Text
                                                        style={[
                                                            message.isRead && { color: "grey" },
                                                            TextFamily.NanumBold,
                                                        ]}
                                                    >
                                                        {message.title}
                                                    </Text>
                                                </View>
                                                <View style={{ paddingLeft: 10 }}>
                                                    <Text
                                                        style={message.isRead && { color: "grey" }}
                                                    >
                                                        {message.body}
                                                    </Text>
                                                </View>
                                            </Card.Content>
                                        </Card>
                                    ))}
                                    <View style={{ height: hp("1%") }} />
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        );

    return (
        <Stack.Navigator
            initialRouteName="HomeScreen"
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTitleStyle: [TextFamily.NanumRegular, { color: "white" }],
            }}
        >
            <Stack.Screen
                name="HomeScreen"
                component={Home}
                options={({ navigation }) => ({
                    title: myBase.auth().currentUser.displayName,
                    headerLeft: () => renderNotificationButton(navigation),
                })}
            />
            <Stack.Screen
                name="Profile"
                component={Profile}
                options={({ navigation }) => ({
                    title: "내 정보",
                    headerLeft: () => renderGoBackButton(navigation),
                    headerRight: () => (
                        <TouchableOpacity
                            style={{
                                marginRight: 10,
                                width: "100%",
                                height: "60%",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            onPress={() => {
                                unsubscribe();
                                signOut();
                            }}
                        >
                            <Text style={[TextSize.normalSize, { color: "white" }]}>로그아웃</Text>
                        </TouchableOpacity>
                    ),
                })}
            />
            <Stack.Screen
                name="GX"
                component={GX}
                options={({ navigation }) => ({ headerLeft: () => renderGoBackButton(navigation) })}
            />
            <Stack.Screen
                name="PT"
                component={PT}
                options={({ navigation }) => ({ headerLeft: () => renderGoBackButton(navigation) })}
            />
            <Stack.Screen
                name="SelectSquashKind"
                component={SelectSquashKind}
                options={({ navigation }) => ({
                    title: "스쿼시",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
            <Stack.Screen
                name="ClientInfo"
                component={ClientInfo}
                options={({ navigation }) => ({
                    title: "고객 정보",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
        </Stack.Navigator>
    );
};

export default TNavigator = ({ navigation, route }) => {
    return <MyStack />;
};
