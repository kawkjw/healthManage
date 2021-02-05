import React, { useContext, useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import myBase, { arrayUnion, db } from "../config/MyBase";
import TNavigator from "./Trainer/TNavigator";
import CNavigator from "./Client/CNavigator";
import LoadingScreen from "./LoadingScreen";
import { Alert, StatusBar, Text, View, TouchableOpacity } from "react-native";
import { AuthContext } from "./Auth";
import { AuthStyles } from "../css/MyStyles";
import { registerForPushNotificationAsync } from "../config/MyExpo";
import ANavigator from "./Admin/ANavigator";
import { RFPercentage } from "react-native-responsive-fontsize";

const Stack = createStackNavigator();
const MyStack = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isTrainer, setIsTrainer] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const { signOut } = useContext(AuthContext);

    const getData = async (user) => {
        setIsVerified(user.emailVerified);
        await db
            .collection("users")
            .doc(user.uid)
            .get()
            .then(async (userDoc) => {
                if (userDoc.exists) {
                    const data = userDoc.data();
                    setIsAdmin(data.permission === 0 ? true : false);
                    setIsTrainer(data.permission === 1 ? true : false);
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
                    //setIsLoading(false);
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
    const storeNotificationToken = async (user) => {
        let notificationToken = null;
        let num = 0;
        while (notificationToken === null) {
            num = num + 1;
            notificationToken = await AsyncStorage.getItem("notificationToken");
            if (num === 100) {
                break;
            }
        }
        if (num === 100) {
            return;
        }
        if (notificationToken !== null) {
            await db
                .collection("notifications")
                .doc(user.uid)
                .update({ expoToken: arrayUnion(notificationToken) });
        }
    };

    const execPromise = async (user) => {
        await registerForPushNotificationAsync().then(async () => {
            await getData(user).then(async () => {
                await storeNotificationToken(user).then(() => {
                    setIsLoading(false);
                });
            });
        });
    };

    useEffect(() => {
        myBase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                const tempUid = await AsyncStorage.getItem("userToken");
                if (tempUid === user.uid) {
                    await execPromise(user);
                    //user.updateProfile({ displayName: "" });
                }
            }
        });
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
                        <Text style={{ fontSize: RFPercentage(2) }}>
                            이메일 인증 완료되지 않았습니다.
                        </Text>
                        <Text style={{ fontSize: RFPercentage(2) }}>
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
            ) : isTrainer ? (
                <Stack.Screen
                    name="Trainer"
                    component={TNavigator}
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
