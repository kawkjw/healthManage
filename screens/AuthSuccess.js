import React, { useContext, useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import myBase, { db } from "../config/MyBase";
import ANavigator from "./Admin/ANavigator";
import CNavigator from "./Client/CNavigator";
import LoadingScreen from "./LoadingScreen";
import { Alert, StatusBar, Text, View, TouchableOpacity } from "react-native";
import { AuthContext } from "./Auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { AuthStyles } from "../css/MyStyles";
import { registerForPushNotificationAsync } from "../config/MyExpo";

const Stack = createStackNavigator();
const MyStack = () => {
    const [user, loading, error] = useAuthState(myBase.auth());
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const { signOut } = useContext(AuthContext);
    useEffect(() => {
        const getData = async () => {
            setIsVerified(user.emailVerified);
            await db
                .collection("users")
                .doc(user.uid)
                .get()
                .then(async (userDoc) => {
                    if (userDoc.exists) {
                        const data = userDoc.data();
                        setIsAdmin(data.permission === 0 ? true : false);
                        if (user.email !== data.email) {
                            await db
                                .collection("emails")
                                .doc(user.uid)
                                .update({ email: user.email });
                            await db
                                .collection("users")
                                .doc(user.uid)
                                .update({ email: user.email });
                        }
                        if (data.permission === 0) {
                            await storeAdminNotificationToken();
                        }
                        setIsLoading(false);
                    } else {
                        signOut();
                    }
                })
                .catch((error) => {
                    if (error.code === "permission-denied") {
                        alert("권한 거부");
                        signOut();
                    }
                });
        };
        const storeNotificationToken = async () => {
            let notificationToken = null;
            while (notificationToken === null) {
                notificationToken = await AsyncStorage.getItem(
                    "notificationToken"
                );
            }
            db.collection("users")
                .doc(user.uid)
                .get()
                .then(async (userDoc) => {
                    const tokenArray = userDoc.data().expoToken;
                    if (
                        tokenArray.indexOf(notificationToken) === -1 &&
                        notificationToken !== null
                    ) {
                        tokenArray.push(notificationToken);
                        await db
                            .collection("users")
                            .doc(user.uid)
                            .update({ expoToken: tokenArray });
                    }
                });
        };
        const storeAdminNotificationToken = async () => {
            let notificationToken = null;
            while (notificationToken === null) {
                notificationToken = await AsyncStorage.getItem(
                    "notificationToken"
                );
            }
            await db
                .collection("adminTokens")
                .doc(user.uid)
                .get()
                .then(async (token) => {
                    const tokenArray = token.data().expoToken;
                    if (
                        tokenArray.indexOf(notificationToken) === -1 &&
                        notificationToken !== null
                    ) {
                        tokenArray.push(notificationToken);
                        await db
                            .collection("adminTokens")
                            .doc(user.uid)
                            .update({ expoToken: tokenArray });
                    }
                });
        };
        registerForPushNotificationAsync();
        getData();
        storeNotificationToken();
    }, []);
    const reSendVerification = () => {
        user.sendEmailVerification()
            .then(() => {
                console.log("Send Email");
                Alert.alert("Success", "Check your email for verification!", [
                    { text: "OK" },
                ]);
            })
            .catch((error) => console.log(error));
    };
    const VerifyEmail = () => {
        return (
            <>
                <StatusBar
                    barStyle={
                        Platform.OS === "ios" ? "dark-content" : "default"
                    }
                />
                <View
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 20,
                    }}
                >
                    <View style={{ alignItems: "center", marginBottom: 10 }}>
                        <Text style={{ fontSize: 17 }}>
                            이메일 인증 완료되지 않았습니다.
                        </Text>
                        <Text style={{ fontSize: 17 }}>
                            인증 메일이 도착하지 않았다면 재전송을 눌러주세요.
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row" }}>
                        <TouchableOpacity
                            style={[AuthStyles.authButton, { marginRight: 5 }]}
                            onPress={reSendVerification}
                        >
                            <Text>재전송</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[AuthStyles.authButton, { marginLeft: 5 }]}
                            onPress={signOut}
                        >
                            <Text>로그아웃</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </>
        );
    };
    return (
        <Stack.Navigator>
            {isLoading ? (
                <Stack.Screen name="Loading" component={LoadingScreen} />
            ) : !isVerified ? (
                <Stack.Screen name="Verify" component={VerifyEmail} />
            ) : isAdmin ? (
                <Stack.Screen
                    name="Admin"
                    component={ANavigator}
                    options={{ headerShown: false }}
                />
            ) : (
                <Stack.Screen
                    name="Client"
                    component={CNavigator}
                    options={{ headerShown: false }}
                />
            )}
        </Stack.Navigator>
    );
};

export default AuthSuccess = ({ navigation, route }) => {
    return <MyStack />;
};
