import React, { useContext, useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
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

const Stack = createStackNavigator();
const MyStack = () => {
    const { signOut } = useContext(AuthContext);
    const uid = myBase.auth().currentUser.uid;
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [endDate, setEndDate] = useState("");
    const [membershipString, setMembershipString] = useState("");
    const [membershipInfo, setMembershipInfo] = useState("");

    const enToKo = (s) => {
        switch (s) {
            case "health":
                return "헬스";
            case "spinning":
                return "스피닝";
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

    const getClientName = async () => {
        const clientName = (await db.collection("users").doc(uid).get()).data()
            .name;
        setName(clientName);
    };

    const getMemberships = async () => {
        await db
            .collection("users")
            .doc(uid)
            .collection("memberships")
            .orderBy("end", "asc")
            .get()
            .then((memberships) => {
                let kinds = [];
                let temp = {};
                memberships.forEach((membership) => {
                    if (membership.id === "pt") {
                        const { count } = membership.data();
                        if (count <= 0) {
                            Alert.alert("Warning", "No Remained PT Count");
                        } else {
                            kinds.push(membership.id);
                            temp[membership.id] = membership.data();
                        }
                    } else {
                        const { end } = membership.data();
                        const today = new Date();
                        if (end.toDate() < today) {
                            Alert.alert(
                                "Warning",
                                `Expired ${enToKo(membership.id)} Membership`
                            );
                        } else {
                            kinds.push(membership.id);
                            temp[membership.id] = membership.data();
                        }
                    }
                });
                if (kinds.length === 0) {
                    setMembershipString("No Membership");
                }
                if (kinds.length >= 1) {
                    let string = enToKo(kinds[0]);
                    if (kinds[0] === "pt") {
                        setEndDate(temp[kinds[0]].count + "번 남음");
                    } else {
                        setEndDate(
                            moment(temp[kinds[0]].end.toDate()).format(
                                "YYYY. MM. DD."
                            ) + " 까지"
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
                            `${temp[kind].month}개월권 (${moment(
                                temp[kind].end.toDate()
                            ).format("YYYY. MM. DD.")} 까지)`;
                    }
                    info = info + stringTemp + "\n";
                });
                setMembershipInfo(
                    info ? info.substring(0, info.length - 1) : "No Membership"
                );
            });
    };

    const execPromise = async () => {
        await getClientName()
            .then(async () => {
                await getMemberships();
            })
            .then(() => {
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
                    headerTitleAlign: "center",
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
                                <Text style={{ fontSize: RFPercentage(2) }}>
                                    {name}님
                                </Text>
                            </View>
                        ),
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
                                Alert.alert("Membership", membershipInfo);
                            }}
                        >
                            <Text style={{ fontSize: RFPercentage(2) }}>
                                {loading ? undefined : membershipString}
                            </Text>
                            {loading ? undefined : endDate !== "" ? (
                                <Text style={{ fontSize: RFPercentage(2) }}>
                                    {endDate}
                                </Text>
                            ) : undefined}
                        </TouchableOpacity>
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
            <Stack.Screen name="Menu" component={Menu} />
            <Stack.Screen name="Info" component={Info} />
            <Stack.Screen name="QRScan" component={QRScan} />
            <Stack.Screen name="Test" component={Test} />
            <Stack.Screen
                name="Class"
                component={Class}
                options={{ title: "예약" }}
            />
            <Stack.Screen
                name="PT"
                component={PT}
                options={({ route }) => ({ title: route.params.trainerName })}
            />
            <Stack.Screen
                name="GX"
                component={GX}
                options={({ route }) => ({
                    title: route.params.date,
                })}
            />
            <Stack.Screen
                name="SelectDate"
                component={SelectDate}
                options={({ route }) => ({
                    title: enToKo(route.params.classname),
                })}
            />
            <Stack.Screen
                name="SelectTrainer"
                component={SelectTrainer}
                options={{ title: "트레이너" }}
            />
        </Stack.Navigator>
    );
};

export default CNavigator = ({ navigation, route }) => {
    return <MyStack />;
};
