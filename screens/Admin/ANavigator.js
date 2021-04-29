import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View, ScrollView, AppState, Linking } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./Home";
import { AuthContext, DataContext } from "../Auth";
import Locker from "./Locker";
import FindUser from "./ManageUser/FindUser";
import SelectUser from "./ManageUser/SelectUser";
import ClientInfo from "./ClientInfo/ClientInfo";
import SelectMembership from "./ClientInfo/SelectMembership";
import ClientInfoMenu from "./ClientInfoMenu";
import ClientsbyMembership from "./ClientInfo/ClientsbyMembership";
import ShowUser from "./ManageUser/ShowUser";
import ClassInfoMenu from "./ClassInfoMenu";
import GxInfo from "./ClassInfo/GxInfo";
import PtInfo from "./ClassInfo/PtInfo";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { MaterialIcons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import * as Notifications from "expo-notifications";
import myBase, { db } from "../../config/MyBase";
import InputPassword from "./InputPassword";
import Sales from "./Sales";
import { TextSize, theme } from "../../css/MyStyles";
import { displayedAt, checkBatchimEnding } from "../../config/hooks";
import { Badge, Button, Card } from "react-native-paper";
import Calculate from "./Calculate";

const Stack = createStackNavigator();
export const WrongNumContext = createContext();
export const AdminContext = createContext();

const MyStack = () => {
    const { signOut } = useContext(AuthContext);
    const { classNames } = useContext(DataContext);
    const uid = myBase.auth().currentUser !== null ? myBase.auth().currentUser.uid : "null";

    const [loading, setLoading] = useState(true);
    const [notificationAvail, setNotificationAvail] = useState(false);
    const [messages, setMessages] = useState([]);
    const [modalNotification, setModalNotification] = useState(false);
    const [unread, setUnread] = useState(false);
    const [notificationNum, setNotificationNum] = useState(0);
    const [unsubscribe, setUnsubscribe] = useState(() => {});

    const [num, setNum] = useState(0);
    const [pw, setPw] = useState("");
    const pwContext = useMemo(() => ({ key: pw }), [pw]);

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

    const getAdminPw = async () => {
        await db
            .collection("keys")
            .doc("pw")
            .get()
            .then((doc) => {
                if (doc.data().key !== undefined) {
                    setPw(doc.data().key);
                }
            });
    };

    useEffect(() => {
        AppState.addEventListener("change", setPermissionNotification);
        getAdminPw().then(async () => {
            await execPromise();
        });
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
                        <View
                            style={{ flexDirection: "row", backgroundColor: theme.colors.primary }}
                        >
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
                                                    navigation.navigate(message.data.navigation, {
                                                        ...message.data.datas,
                                                    });
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
                                    <View style={{ height: hp("1%") }} />
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        );

    return (
        <WrongNumContext.Provider value={{ num: num, setNum: setNum }}>
            <AdminContext.Provider value={pwContext}>
                <Stack.Navigator
                    initialRouteName="HomeScreen"
                    screenOptions={{
                        headerStyle: { backgroundColor: theme.colors.primary },
                        headerTitleStyle: { color: "white" },
                    }}
                >
                    <Stack.Screen
                        name="HomeScreen"
                        component={Home}
                        options={({ navigation }) => ({
                            title: "관리자",
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
                                        unsubscribe();
                                        signOut();
                                    }}
                                >
                                    <Text style={[TextSize.normalSize, { color: "white" }]}>
                                        로그아웃
                                    </Text>
                                </TouchableOpacity>
                            ),
                        })}
                    />
                    <Stack.Screen
                        name="Locker"
                        component={Locker}
                        options={({ navigation }) => ({
                            title: "락커",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="FindUser"
                        component={FindUser}
                        options={({ navigation }) => ({
                            headerTitle: "고객 검색",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="SelectUser"
                        component={SelectUser}
                        options={({ navigation }) => ({
                            headerTitle: "검색 결과",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="ShowUser"
                        component={ShowUser}
                        options={({ navigation }) => ({
                            headerTitle: "고객 정보",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="ClientInfoMenu"
                        component={ClientInfoMenu}
                        options={({ navigation }) => ({
                            headerTitle: "메뉴",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="SelectMembership"
                        component={SelectMembership}
                        options={({ navigation }) => ({
                            headerTitle: "이용권 선택",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="ClientInfo"
                        component={ClientInfo}
                        options={({ navigation }) => ({
                            headerTitle: "모든 고객 정보",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="ClientsbyMembership"
                        component={ClientsbyMembership}
                        options={({ navigation, route }) => ({
                            headerTitle:
                                classNames[route.params.membershipName] !== undefined
                                    ? classNames[route.params.membershipName].ko
                                    : "Error",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="ClassInfoMenu"
                        component={ClassInfoMenu}
                        options={({ navigation }) => ({
                            headerTitle: "메뉴",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="GxInfo"
                        component={GxInfo}
                        options={({ navigation }) => ({
                            headerTitle: "GX",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="PtInfo"
                        component={PtInfo}
                        options={({ navigation, route }) => ({
                            headerTitle: route.params.ptName === "pt" ? "PT" : "스쿼시 PT",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="InputPassword"
                        component={InputPassword}
                        options={({ navigation }) => ({
                            headerTitle: "비밀번호 입력",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="Sales"
                        component={Sales}
                        options={({ navigation }) => ({
                            headerTitle: "결산",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                    <Stack.Screen
                        name="Calculate"
                        component={Calculate}
                        options={({ navigation }) => ({
                            headerTitle: "PT 정산",
                            headerLeft: () => renderGoBackButton(navigation),
                        })}
                    />
                </Stack.Navigator>
            </AdminContext.Provider>
        </WrongNumContext.Provider>
    );
};

export default ANavigator = () => {
    return <MyStack />;
};
