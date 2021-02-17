import React, { useContext, useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./Home";
import Profile from "./Profile";
import { AuthContext } from "../Auth";
import Menu from "./Menu";
import Info from "./Menus/Info";
import QRScan from "./Infos/QRScan";
import Test from "./Infos/Test";
import myBase, { db } from "../../config/MyBase";
import moment from "moment";
import Class from "./Menus/Class";
import PT from "./Classes/PT";
import SelectDate from "./Classes/SelectDate";
import GX from "./Classes/GX";
import SelectTrainer from "./Classes/SelectTrainer";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { MaterialIcons } from "@expo/vector-icons";
import * as Permissions from "expo-permissions";
import Modal from "react-native-modal";
import * as Notifications from "expo-notifications";
import ExtendDate from "./Menus/ExtendDate";

const Stack = createStackNavigator();
const MyStack = () => {
    const { signOut } = useContext(AuthContext);
    const uid = myBase.auth().currentUser.uid;
    const [loading, setLoading] = useState(true);
    const [endDate, setEndDate] = useState("");
    const [membershipString, setMembershipString] = useState("");
    const [membershipInfo, setMembershipInfo] = useState("");
    const [notificationAvail, setNotificationAvail] = useState(false);
    const [messages, setMessages] = useState([]);
    const [modalNotification, setModalNotification] = useState(false);
    const [unread, setUnread] = useState(false);
    const [notificationNum, setNotificationNum] = useState(0);
    const [notificationUnsubscribe, setNotificationUnsubscribe] = useState(() => {});
    const [membershipUnsubscribe, setMembershipUnsubsribe] = useState(() => {});

    const enToKo = (s) => {
        switch (s) {
            case "health":
                return "헬스";
            case "spinning":
                return "스피닝";
            case "GX":
                return "GX";
            case "yoga":
                return "요가";
            case "zoomba":
                return "줌바";
            case "squash":
                return "스쿼시";
            case "pilates":
                return "필라테스";
            case "pt":
                return "PT";
        }
    };

    const getMemberships = async () => {
        const func = db
            .collection("users")
            .doc(uid)
            .collection("memberships")
            .orderBy("end", "asc")
            .onSnapshot((memberships) => {
                let kinds = [];
                let temp = {};
                let ret = "";
                memberships.forEach((membership) => {
                    if (membership.id === "pt") {
                        const { count } = membership.data();
                        if (count <= 0) {
                            Alert.alert("경고", "남은 PT 횟수가 없습니다.");
                        } else {
                            kinds.push(membership.id);
                            temp[membership.id] = membership.data();
                        }
                    } else {
                        const { end } = membership.data();
                        const today = new Date();
                        if (end.toDate() < today) {
                            Alert.alert(
                                "경고",
                                `${enToKo(membership.id)} 회원권이 만료되었습니다.`
                            );
                        } else {
                            kinds.push(membership.id);
                            temp[membership.id] = membership.data();
                        }
                    }
                });
                if (kinds.length === 0) {
                    setMembershipString("회원권이 없습니다.");
                }
                if (kinds.length >= 1) {
                    let string = enToKo(kinds[0]);
                    if (kinds[0] === "pt") {
                        setEndDate(temp[kinds[0]].count + "번 남음");
                    } else {
                        setEndDate(
                            moment(temp[kinds[0]].end.toDate()).format("YYYY. MM. DD.") + " 까지"
                        );
                    }
                    if (kinds.length >= 2) {
                        string = string + ", " + enToKo(kinds[1]);
                    }
                    if (kinds.length >= 3) {
                        string = string + ", 등";
                    }
                    setMembershipString(string);
                }
                let info = "";
                kinds.map((kind) => {
                    let stringTemp = enToKo(kind) + ": ";
                    if (kind === "pt") {
                        stringTemp = stringTemp + `${temp[kind].count}번 남음`;
                    } else {
                        stringTemp =
                            stringTemp +
                            `${temp[kind].month}개월권 (${moment(temp[kind].end.toDate()).format(
                                "YYYY. MM. DD."
                            )} 까지)`;
                    }
                    info = info + stringTemp + "\n";
                });
                ret = info ? info.substring(0, info.length - 1) : "회원권이 없습니다.";
                setMembershipInfo(ret);
            });
        return func;
    };

    const getNotifications = async () => {
        const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
        if (existingStatus === "granted") {
            setNotificationAvail(true);
            setUnread(false);
            const today = new Date();
            const func = db
                .collection("notifications")
                .doc(uid)
                .collection("messages")
                .where(
                    "sendDate",
                    ">=",
                    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
                )
                .orderBy("sendDate", "desc")
                .onSnapshot(async (messages) => {
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
            return func;
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
        await getMemberships().then(async (ret) => {
            setMembershipUnsubsribe(() => ret);
            await getNotifications().then((func) => {
                setNotificationUnsubscribe(() => func);
                setLoading(false);
            });
        });
    };

    useEffect(() => {
        execPromise();
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
            <MaterialIcons name="arrow-back-ios" size={RFPercentage(2.5)} color="black" />
        </TouchableOpacity>
    );

    const renderNotificationButton = (navigation) =>
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
                            unread ? { backgroundColor: "red" } : { backgroundColor: "white" },
                        ]}
                    />
                    <MaterialIcons
                        name={notificationAvail ? "notifications" : "notifications-off"}
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
                    onBackdropPress={() => setModalNotification(false)}
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
                                onPress={() => setModalNotification(false)}
                            >
                                <Text
                                    style={{
                                        margin: 7,
                                        fontSize: RFPercentage(2),
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
                                        fontSize: RFPercentage(2),
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
                                            fontSize: RFPercentage(2.5),
                                        }}
                                    >
                                        알림 없음
                                    </Text>
                                </View>
                            ) : (
                                <ScrollView>
                                    {messages.map((message, index) => (
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
                                                    setModalNotification(false);
                                                    if (!message.isRead) {
                                                        checkNotification(message.id);
                                                    }
                                                    if (message.data.navigation) {
                                                        navigation.navigate(
                                                            message.data.navigation
                                                        );
                                                    }
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: "row",
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
                                                                          color: "grey",
                                                                      }
                                                                    : {
                                                                          color: "black",
                                                                      },
                                                            ]}
                                                        >
                                                            {message.sendFrom + " 로부터"}
                                                        </Text>
                                                    </View>
                                                    <View
                                                        style={{
                                                            alignItems: "flex-end",
                                                            flex: 1,
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                message.isRead
                                                                    ? {
                                                                          color: "grey",
                                                                      }
                                                                    : {
                                                                          color: "black",
                                                                      },
                                                            ]}
                                                        >
                                                            {moment(
                                                                message.sendDate.toDate()
                                                            ).format("MM.DD. HH:mm") + " 에 보냄"}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text
                                                    style={[
                                                        message.isRead
                                                            ? {
                                                                  color: "grey",
                                                              }
                                                            : {
                                                                  color: "black",
                                                              },
                                                        {
                                                            fontWeight: "bold",
                                                            marginBottom: 5,
                                                        },
                                                    ]}
                                                >
                                                    {message.title}
                                                </Text>
                                                <Text
                                                    style={[
                                                        message.isRead
                                                            ? {
                                                                  color: "grey",
                                                              }
                                                            : {
                                                                  color: "black",
                                                              },
                                                        {
                                                            marginLeft: 7,
                                                        },
                                                    ]}
                                                >
                                                    {message.body}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        );

    return (
        <Stack.Navigator initialRouteName="HomeScreen">
            <Stack.Screen
                name="HomeScreen"
                component={Home}
                options={({ navigation }) => ({
                    title: myBase.auth().currentUser.displayName + "님",
                    headerTitleAlign: "center",
                    headerLeft: () => renderNotificationButton(navigation),
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
                                Alert.alert("회원권 정보", membershipInfo);
                            }}
                        >
                            <Text style={{ fontSize: RFPercentage(2) }}>
                                {loading ? undefined : membershipString}
                            </Text>
                            {loading ? undefined : endDate !== "" ? (
                                <Text style={{ fontSize: RFPercentage(2) }}>{endDate}</Text>
                            ) : undefined}
                        </TouchableOpacity>
                    ),
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
                                membershipUnsubscribe();
                                notificationUnsubscribe();
                                signOut();
                            }}
                        >
                            <Text style={{ fontSize: RFPercentage(2) }}>로그아웃</Text>
                        </TouchableOpacity>
                    ),
                })}
            />
            <Stack.Screen
                name="Menu"
                component={Menu}
                options={({ navigation }) => ({
                    title: "메뉴",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
            <Stack.Screen
                name="Info"
                component={Info}
                options={({ navigation }) => ({
                    title: "정보",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
            <Stack.Screen
                name="QRScan"
                component={QRScan}
                options={({ navigation }) => ({
                    title: "QR코드 스캔",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
            <Stack.Screen
                name="Test"
                component={Test}
                options={({ navigation }) => ({ headerLeft: () => renderGoBackButton(navigation) })}
            />
            <Stack.Screen
                name="Class"
                component={Class}
                options={({ navigation }) => ({
                    title: "예약",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
            <Stack.Screen
                name="PT"
                component={PT}
                options={({ navigation, route }) => ({
                    title: route.params.trainerName,
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
            <Stack.Screen
                name="GX"
                component={GX}
                options={({ navigation, route }) => ({
                    title: route.params.date,
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
            <Stack.Screen
                name="SelectDate"
                component={SelectDate}
                options={({ navigation, route }) => ({
                    title: enToKo(route.params.classname),
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
            <Stack.Screen
                name="SelectTrainer"
                component={SelectTrainer}
                options={({ navigation }) => ({
                    title: "트레이너",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
            <Stack.Screen
                name="ExtendDate"
                component={ExtendDate}
                options={({ navigation }) => ({
                    title: "이용권 연장",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
        </Stack.Navigator>
    );
};

export default CNavigator = () => {
    return <MyStack />;
};
