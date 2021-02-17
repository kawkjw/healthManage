import React, { useContext, useEffect, useState } from "react";
import { Text, TouchableOpacity, View, ScrollView } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./Home";
import { AuthContext } from "../Auth";
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
import * as Permissions from "expo-permissions";
import Modal from "react-native-modal";
import * as Notifications from "expo-notifications";
import myBase, { db } from "../../config/MyBase";
import moment from "moment";

const Stack = createStackNavigator();
const MyStack = () => {
    const { signOut } = useContext(AuthContext);
    const uid = myBase.auth().currentUser.uid;

    const [loading, setLoading] = useState(true);
    const [notificationAvail, setNotificationAvail] = useState(false);
    const [messages, setMessages] = useState([]);
    const [modalNotification, setModalNotification] = useState(false);
    const [unread, setUnread] = useState(false);
    const [notificationNum, setNotificationNum] = useState(0);
    const [unsubscribe, setUnsubscribe] = useState(() => {});

    const enToKo = (s) => {
        switch (s) {
            case "health":
                return "헬스";
            case "spinning":
                return "스피닝";
            case "GX":
                return "GX(요가, 줌바)";
            case "squash":
                return "스쿼시";
            case "pilates":
                return "필라테스";
            case "pt":
                return "PT";
        }
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
        await getNotifications().then((func) => {
            setUnsubscribe(func === undefined ? () => console.log : () => func);
            setLoading(false);
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
                            paddingBottom: 60,
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
                                                            message.data.navigation,
                                                            {
                                                                ...message.data.datas,
                                                            }
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
                            <Text style={{ fontSize: RFPercentage(2) }}>로그아웃</Text>
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
                    headerTitle: enToKo(route.params.membershipName),
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
                options={({ navigation }) => ({
                    headerTitle: "PT",
                    headerLeft: () => renderGoBackButton(navigation),
                })}
            />
        </Stack.Navigator>
    );
};

export default ANavigator = () => {
    return <MyStack />;
};
