import React, { useContext, useEffect, useState } from "react";
import {
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
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
import * as Permissions from "expo-permissions";
import Modal from "react-native-modal";
import * as Notifications from "expo-notifications";
import myBase, { db } from "../../config/MyBase";
import moment from "moment";

const Stack = createStackNavigator();
const MyStack = ({ navigation }) => {
    const { signOut } = useContext(AuthContext);
    const uid = myBase.auth().currentUser.uid;
    const [limit, setLimit] = useState([]);

    const [loading, setLoading] = useState(true);
    const [notificationAvail, setNotificationAvail] = useState(false);
    const [messages, setMessages] = useState([]);
    const [modalNotification, setModalNotification] = useState(false);
    const [unread, setUnread] = useState(false);
    const [notificationNum, setNotificationNum] = useState(0);

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
        const { status: existingStatus } = await Permissions.getAsync(
            Permissions.NOTIFICATIONS
        );
        if (existingStatus === "granted") {
            setNotificationAvail(true);
            setUnread(false);
            const today = new Date();
            await db
                .collection("notifications")
                .doc(uid)
                .collection("messages")
                .where(
                    "sendDate",
                    ">=",
                    new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate() - 7
                    )
                )
                .orderBy("sendDate", "desc")
                .get()
                .then(async (messages) => {
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
                    setMessages(list);
                    setNotificationNum(num);
                    await Notifications.setBadgeCountAsync(num);
                });
        }
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
        await getPTLimit();
        await getNotifications().then(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        execPromise();
    }, []);

    return (
        <Stack.Navigator initialRouteName="HomeScreen">
            <Stack.Screen
                name="HomeScreen"
                component={Home}
                options={{
                    title: "Home",
                    headerLeft: () =>
                        loading ? undefined : (
                            <View
                                style={{
                                    marginLeft: 10,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                    height: "60%",
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
                                    <View
                                        style={[
                                            {
                                                borderRadius: 100,
                                                position: "absolute",
                                                width: 10,
                                                height: 10,
                                                top: 0,
                                                right: 0,
                                            },
                                            unread
                                                ? { backgroundColor: "red" }
                                                : { backgroundColor: "white" },
                                        ]}
                                    />
                                    <MaterialIcons
                                        name={
                                            notificationAvail
                                                ? "notifications"
                                                : "notifications-off"
                                        }
                                        size={RFPercentage(3.5)}
                                        color="black"
                                    />
                                </TouchableOpacity>
                                <Modal
                                    isVisible={modalNotification}
                                    style={{
                                        justifyContent: "flex-end",
                                        margin: 0,
                                    }}
                                    onBackdropPress={() =>
                                        setModalNotification(false)
                                    }
                                >
                                    <View
                                        style={{
                                            height: hp("80%"),
                                            backgroundColor: "white",
                                        }}
                                    >
                                        <View style={{ flexDirection: "row" }}>
                                            <TouchableOpacity
                                                style={{
                                                    padding: 5,
                                                    width: wp("13%"),
                                                    alignItems: "center",
                                                }}
                                                onPress={() =>
                                                    setModalNotification(false)
                                                }
                                            >
                                                <Text
                                                    style={{
                                                        margin: 7,
                                                        fontSize: RFPercentage(
                                                            2
                                                        ),
                                                    }}
                                                >
                                                    닫기
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={{
                                                    padding: 5,
                                                    width: wp("20%"),
                                                    alignItems: "center",
                                                    position: "absolute",
                                                    right: 0,
                                                }}
                                                onPress={() => {
                                                    checkAllNotification();
                                                    setModalNotification(false);
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        margin: 7,
                                                        fontSize: RFPercentage(
                                                            2
                                                        ),
                                                    }}
                                                >
                                                    모두 읽음
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={{ borderWidth: "0.5" }} />
                                        <View>
                                            {messages.length === 0 ? (
                                                <View style={{ padding: 10 }}>
                                                    <Text
                                                        style={{
                                                            fontSize: RFPercentage(
                                                                2.5
                                                            ),
                                                        }}
                                                    >
                                                        알림 없음
                                                    </Text>
                                                </View>
                                            ) : (
                                                <ScrollView>
                                                    {messages.map(
                                                        (message, index) => (
                                                            <View
                                                                key={index}
                                                                style={{
                                                                    padding: 10,
                                                                    borderWidth: 1,
                                                                    margin: 10,
                                                                }}
                                                            >
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        setModalNotification(
                                                                            false
                                                                        );
                                                                        if (
                                                                            !message.isRead
                                                                        ) {
                                                                            checkNotification(
                                                                                message.id
                                                                            );
                                                                        }
                                                                        if (
                                                                            message
                                                                                .data
                                                                                .navigation ===
                                                                            "PT"
                                                                        ) {
                                                                            navigation.navigate(
                                                                                message
                                                                                    .data
                                                                                    .navigation,
                                                                                {
                                                                                    limit: limit,
                                                                                    ...message
                                                                                        .data
                                                                                        .datas,
                                                                                }
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <View
                                                                        style={{
                                                                            flexDirection:
                                                                                "row",
                                                                        }}
                                                                    >
                                                                        <View
                                                                            style={{
                                                                                flex: 1,
                                                                            }}
                                                                        >
                                                                            <Text
                                                                                style={[
                                                                                    message.isRead
                                                                                        ? {
                                                                                              color:
                                                                                                  "grey",
                                                                                          }
                                                                                        : {
                                                                                              color:
                                                                                                  "black",
                                                                                          },
                                                                                ]}
                                                                            >
                                                                                {message.sendFrom +
                                                                                    " 로부터"}
                                                                            </Text>
                                                                        </View>
                                                                        <View
                                                                            style={{
                                                                                alignItems:
                                                                                    "flex-end",
                                                                                flex: 1,
                                                                            }}
                                                                        >
                                                                            <Text
                                                                                style={[
                                                                                    message.isRead
                                                                                        ? {
                                                                                              color:
                                                                                                  "grey",
                                                                                          }
                                                                                        : {
                                                                                              color:
                                                                                                  "black",
                                                                                          },
                                                                                ]}
                                                                            >
                                                                                {moment(
                                                                                    message.sendDate.toDate()
                                                                                ).format(
                                                                                    "MM.DD. HH:mm"
                                                                                ) +
                                                                                    " 에 보냄"}
                                                                            </Text>
                                                                        </View>
                                                                    </View>
                                                                    <Text
                                                                        style={[
                                                                            message.isRead
                                                                                ? {
                                                                                      color:
                                                                                          "grey",
                                                                                  }
                                                                                : {
                                                                                      color:
                                                                                          "black",
                                                                                  },
                                                                            {
                                                                                fontWeight:
                                                                                    "bold",
                                                                                marginBottom: 5,
                                                                            },
                                                                        ]}
                                                                    >
                                                                        {
                                                                            message.title
                                                                        }
                                                                    </Text>
                                                                    <Text
                                                                        style={[
                                                                            message.isRead
                                                                                ? {
                                                                                      color:
                                                                                          "grey",
                                                                                  }
                                                                                : {
                                                                                      color:
                                                                                          "black",
                                                                                  },
                                                                            {
                                                                                marginLeft: 7,
                                                                            },
                                                                        ]}
                                                                    >
                                                                        {
                                                                            message.body
                                                                        }
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        )
                                                    )}
                                                </ScrollView>
                                            )}
                                        </View>
                                    </View>
                                </Modal>
                            </View>
                        ),
                }}
            />
            <Stack.Screen
                name="Profile"
                component={Profile}
                options={{
                    title: "사용자 정보",
                    headerLeft: () => {},
                    headerRight: () => (
                        <TouchableOpacity
                            style={{
                                marginRight: 10,
                                width: "100%",
                                height: "60%",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            onPress={signOut}
                        >
                            <Text>로그아웃</Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            <Stack.Screen name="GX" component={GX} />
            <Stack.Screen name="PT" component={PT} />
        </Stack.Navigator>
    );
};

export default TNavigator = ({ navigation, route }) => {
    return <MyStack navigation={navigation} />;
};
