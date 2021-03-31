import React, { useContext, useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import myBase, { arrayUnion, db } from "../config/MyBase";
import TNavigator from "./Trainer/TNavigator";
import CNavigator from "./Client/CNavigator";
import LoadingScreen from "./LoadingScreen";
import { AuthContext } from "./Auth";
import { registerForPushNotificationAsync } from "../config/MyExpo";
import ANavigator from "./Admin/ANavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Stack = createStackNavigator();
const MyStack = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isTrainer, setIsTrainer] = useState(false);
    const { signOut } = useContext(AuthContext);

    const getData = async (user) => {
        await db
            .collection("users")
            .doc(user.uid)
            .get()
            .then(async (userDoc) => {
                if (userDoc.exists) {
                    const data = userDoc.data();
                    setIsAdmin(data.permission === 0 ? true : false);
                    setIsTrainer(data.permission === 1 ? true : false);
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
        const unsubscribe = myBase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                const tempUid = await AsyncStorage.getItem("userToken");
                if (tempUid === user.uid) {
                    await execPromise(user);
                } else {
                    signOut();
                }
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <Stack.Navigator>
            {isLoading ? (
                <Stack.Screen
                    name="Loading"
                    component={LoadingScreen}
                    options={{ headerShown: false }}
                />
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
