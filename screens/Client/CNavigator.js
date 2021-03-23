import React, { useContext, useEffect, useState } from "react";
import { Alert, AppState, Linking, ScrollView, TouchableOpacity, View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./Home";
import Profile from "./Profile";
import { AuthContext, DataContext } from "../Auth";
import Menu from "./Menu";
import Info from "./Menus/Info";
import QRScan from "./Infos/QRScan";
import Test from "./Infos/Test";
import myBase, { db } from "../../config/MyBase";
import Class from "./Menus/Class";
import PT from "./Classes/PT";
import SelectDate from "./Classes/SelectDate";
import GX from "./Classes/GX";
import SelectSquashKind from "./Classes/SelectSquashKind";
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
import SelectTrainer from "./Infos/SelectTrainer";
import OT from "./Infos/OT";
import { TextSize } from "../../css/MyStyles";
import { displayedAt, checkBatchimEnding } from "../../config/hooks";
import { Badge, Button, Card, Text } from "react-native-paper";

const Stack = createStackNavigator();
const MyStack = () => {
    const { signOut } = useContext(AuthContext);
    const { classNames } = useContext(DataContext);
    const uid = myBase.auth().currentUser.uid;
    const [loading, setLoading] = useState(true);
    const [membershipString, setMembershipString] = useState("");
    const [notificationAvail, setNotificationAvail] = useState(false);
    const [messages, setMessages] = useState([]);
    const [modalNotification, setModalNotification] = useState(false);
    const [unread, setUnread] = useState(false);
    const [notificationNum, setNotificationNum] = useState(0);
    const [notificationUnsubscribe, setNotificationUnsubscribe] = useState(() => {});
    const [membershipUnsubscribe, setMembershipUnsubsribe] = useState(() => {});

    const getMemberships = async () => {
        const today = new Date();
        let kinds = [];
        await db
            .collection("users")
            .doc(uid)
            .collection("memberships")
            .doc("list")
            .get()
            .then((doc) => {
                if (doc.data().classes !== undefined) {
                    kinds = doc.data().classes;
                }
            })
            .then(async () => {
                let kindsWithoutPt = kinds.slice();
                const i1 = kindsWithoutPt.indexOf("pt");
                if (i1 > -1) kindsWithoutPt.splice(i1, 1);

                const i2 = kindsWithoutPt.indexOf("squashpt");
                if (i2 > -1) kindsWithoutPt.splice(i2, 1);

                const promises = kindsWithoutPt.map(async (name) => {
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("memberships")
                        .doc("list")
                        .collection(name)
                        .orderBy("payDay", "desc")
                        .limit(1)
                        .get()
                        .then((docs) => {
                            docs.forEach((doc) => {
                                const { end } = doc.data();
                                if (doc.data().start === undefined) {
                                    Alert.alert(
                                        "경고",
                                        `${
                                            classNames[name] !== undefined
                                                ? classNames[name].miniKo
                                                : "Error"
                                        } 회원권 시작일 설정이 되지 않았습니다.\n관리자에게 문의해주시기 바랍니다.`,
                                        [{ text: "확인" }],
                                        { cancelable: false }
                                    );
                                }
                                if (end.toDate() < today) {
                                    const i = kindsWithoutPt.indexOf(name);
                                    if (i > -1) kindsWithoutPt.splice(i, 1);
                                    if (doc.data().check === undefined) {
                                        Alert.alert(
                                            "경고",
                                            `${
                                                classNames[name] !== undefined
                                                    ? classNames[name].miniKo
                                                    : "Error"
                                            } 회원권이 만료되었습니다.`,
                                            [
                                                {
                                                    text: "확인",
                                                    onPress: async () => {
                                                        doc.ref.set(
                                                            { check: true },
                                                            { merge: true }
                                                        );
                                                    },
                                                },
                                            ],
                                            { cancelable: false }
                                        );
                                    }
                                }
                            });
                        });
                });
                await Promise.all(promises);
                if (kindsWithoutPt.length === 0) {
                    setMembershipString("회원권이 없습니다.");
                }
                if (kindsWithoutPt.length >= 1) {
                    let string =
                        classNames[kindsWithoutPt[0]] !== undefined
                            ? classNames[kindsWithoutPt[0]].miniKo
                            : "Error";
                    if (kindsWithoutPt.length >= 2) {
                        string =
                            string +
                            ", " +
                            (classNames[kindsWithoutPt[1]] !== undefined
                                ? classNames[kindsWithoutPt[1]].miniKo
                                : "Error");
                    }
                    if (kindsWithoutPt.length >= 3) {
                        string = string + ", 등";
                    }
                    setMembershipString(string);
                }
            })
            .catch((error) => {
                console.log("CNaviagtor", error);
                setMembershipString("회원권이 없습니다.");
            });

        if (kinds.indexOf("squashpt") !== -1) {
            const func = db
                .collection("users")
                .doc(uid)
                .collection("memberships")
                .doc("list")
                .collection("squashpt")
                .orderBy("payDay", "desc")
                .limit(1)
                .onSnapshot(
                    (docs) => {
                        docs.forEach((doc) => {
                            const { count } = doc.data();
                            if (count === 0) {
                                Alert.alert(
                                    "경고",
                                    "남은 스쿼시 PT 횟수가 없습니다.",
                                    [
                                        {
                                            text: "확인",
                                            onPress: async () => {
                                                await doc.ref.update({ count: -1 });
                                            },
                                        },
                                    ],
                                    { cancelable: false }
                                );
                            }
                        });
                    },
                    (error) => {
                        func();
                    }
                );
        }

        if (kinds.indexOf("pt") !== -1) {
            const func = db
                .collection("users")
                .doc(uid)
                .collection("memberships")
                .doc("list")
                .collection("pt")
                .orderBy("payDay", "desc")
                .limit(1)
                .onSnapshot(
                    (docs) => {
                        docs.forEach((doc) => {
                            const { count } = doc.data();
                            if (count === 0) {
                                Alert.alert(
                                    "경고",
                                    "남은 PT 횟수가 없습니다.",
                                    [
                                        {
                                            text: "확인",
                                            onPress: async () => {
                                                await doc.ref.update({ count: -1 });
                                            },
                                        },
                                    ],
                                    { cancelable: false }
                                );
                            }
                        });
                    },
                    (error) => {
                        func();
                    }
                );
            return func;
        }
        return console.log;
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
        const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
        if (status === "granted") {
            setNotificationAvail(true);
        }
        await getMemberships().then(async (ret) => {
            setMembershipUnsubsribe(ret === undefined ? () => console.log : () => ret);
            await getNotifications().then((func) => {
                setNotificationUnsubscribe(func === undefined ? () => console.log : () => func);
                setLoading(false);
            });
        });
    };

    const setPermissionNotification = async (state) => {
        if (state === "active") {
            const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
            if (status !== "granted") {
                setUnread(false);
                setNotificationAvail(false);
            } else {
                setNotificationAvail(true);
                if (notificationNum > 0) {
                    setUnread(true);
                }
            }
            await getMemberships().then((ret) => {
                setMembershipUnsubsribe(ret === undefined ? () => console.log : () => ret);
            });
        }
    };

    useEffect(() => {
        AppState.addEventListener("change", setPermissionNotification);
        execPromise();
        return () => {
            AppState.removeEventListener("change", setPermissionNotification);
        };
    }, []);

    const resetRandom = async () => {
        if (uid !== null) {
            await db
                .collection("users")
                .doc(uid)
                .get()
                .then((user) => {
                    if (user.exists) {
                        if (user.data().random !== " ") {
                            user.ref.update({
                                random: " ",
                            });
                        }
                    }
                })
                .catch((error) => console.log("reset random", error.code));
        }
    };

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
                    {notificationAvail && (
                        <Badge
                            size={10}
                            visible={unread}
                            style={{ position: "absolute", right: 3 }}
                        />
                    )}
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
                        <View style={{ flexDirection: "row", backgroundColor: "#3366cc" }}>
                            <Button
                                onPress={() => setModalNotification(false)}
                                mode="text"
                                compact={true}
                                labelStyle={{ padding: 4, color: "white", fontWeight: "bold" }}
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
                                labelStyle={{ padding: 4, color: "white", fontWeight: "bold" }}
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
                                                if (message.data.navigation) {
                                                    navigation.navigate(message.data.navigation);
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
                                                            { fontWeight: "bold" },
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
                headerStyle: { backgroundColor: "#3366cc" },
                headerTitleStyle: { color: "white" },
            }}
        >
            <Stack.Screen
                name="HomeScreen"
                component={Home}
                options={({ navigation }) => ({
                    title: myBase.auth().currentUser.displayName + "님",
                    headerTitleAlign: "center",
                    headerLeft: () => renderNotificationButton(navigation),
                    headerRight: () => (
                        <View
                            style={{
                                marginRight: 10,
                                width: "100%",
                                height: "60%",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Text
                                style={[TextSize.normalSize, { marginBottom: 3, color: "white" }]}
                            >
                                회원권
                            </Text>
                            <Text style={[TextSize.normalSize, { color: "white" }]}>
                                {loading ? undefined : membershipString}
                            </Text>
                        </View>
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
                                resetRandom();
                                membershipUnsubscribe();
                                notificationUnsubscribe();
                                signOut();
                            }}
                        >
                            <Text style={[TextSize.normalSize, { color: "white" }]}>로그아웃</Text>
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
                    title: "OT 예약 및 기구 사용 정보",
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
                name="SelectTrainer"
                component={SelectTrainer}
                options={({ navigation }) => ({
                    title: "트레이너 선택",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
            <Stack.Screen
                name="OT"
                component={OT}
                options={({ navigation, route }) => ({
                    title: route.params.trainerName + " 트레이너",
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
                    title: route.params.trainerName + " 트레이너",
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
                    title:
                        classNames[route.params.classname] !== undefined
                            ? classNames[route.params.classname].ko
                            : "Error",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
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
