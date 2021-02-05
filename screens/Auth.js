import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { Alert } from "react-native";
import myBase, { arrayDelete, db } from "../config/MyBase";
import firebase from "firebase";
import LoadingScreen from "./LoadingScreen";
import AuthSuccess from "./AuthSuccess";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SignIn from "./Auth/SignIn";
import SignUp from "./Auth/SignUp";
import ResetPw from "./Auth/ResetPw";
import { ADMIN_CODE, TRAINER_CODE } from "@env";
import { pushNotificationsToAdmin } from "../config/MyExpo";

const Stack = createStackNavigator();

export const AuthContext = React.createContext();

export default function Auth({ navigation, route }) {
    const [state, dispatch] = React.useReducer(
        (prevState, action) => {
            switch (action.type) {
                case "RESTORE_TOKEN":
                    return {
                        ...prevState,
                        userToken: action.token,
                        isLoading: false,
                    };
                case "SIGN_IN":
                    return {
                        ...prevState,
                        isSignout: false,
                        userToken: action.token,
                    };
                case "SIGN_OUT":
                    return {
                        ...prevState,
                        isSignout: true,
                        userToken: null,
                    };
            }
        },
        {
            isLoading: true,
            isSignout: false,
            userToken: null,
        }
    );
    React.useEffect(() => {
        const restoreToken = async () => {
            let userToken;
            try {
                userToken = await AsyncStorage.getItem("userToken");
            } catch (error) {
                console.log(error);
            }
            dispatch({ type: "RESTORE_TOKEN", token: userToken });
        };
        restoreToken();
    }, []);
    const authContext = React.useMemo(
        () => ({
            signIn: async (data) => {
                const { email, password } = data;
                try {
                    const response = await myBase
                        .auth()
                        .signInWithEmailAndPassword(email, password);
                    AsyncStorage.setItem("userToken", response.user.uid);
                    dispatch({ type: "SIGN_IN", token: response.user.uid });
                } catch (error) {
                    if (error.code === "auth/wrong-password") {
                        Alert.alert("Error", "Wrong Password", [
                            { text: "OK" },
                        ]);
                    } else if (error.code === "auth/invalid-email") {
                        Alert.alert("Error", "Input correct email", [
                            { text: "OK" },
                        ]);
                    } else if (error.code === "auth/user-not-found") {
                        Alert.alert("Error", "User not found", [
                            { text: "OK" },
                        ]);
                    } else {
                        Alert.alert("Error", error.message, [{ text: "OK" }]);
                    }
                }
            },
            signOut: async () => {
                const token = await AsyncStorage.getItem("notificationToken");
                await db
                    .collection("notifications")
                    .doc(myBase.auth().currentUser.uid)
                    .update({ expoToken: arrayDelete(token) });
                myBase.auth().signOut();
                await AsyncStorage.multiRemove([
                    "userToken",
                    "notificationToken",
                ]);
                dispatch({ type: "SIGN_OUT" });
            },
            signUp: async (data) => {
                const {
                    name,
                    phoneNumber,
                    email,
                    password,
                    adminCode,
                    verificationId,
                    verifyCode,
                } = data;
                const isAdmin = adminCode === ADMIN_CODE ? true : false;
                const isTrainer = adminCode === TRAINER_CODE ? true : false;
                await myBase
                    .auth()
                    .createUserWithEmailAndPassword(email, password)
                    .then(async (userCredential) => {
                        const currentUser = {
                            id: userCredential.user.uid,
                            email: email,
                            name: name,
                            phoneNumber: phoneNumber,
                            permission: isAdmin ? 0 : isTrainer ? 1 : 2,
                            emailVerified: userCredential.user.emailVerified,
                        };

                        const phoneCredential = firebase.auth.PhoneAuthProvider.credential(
                            verificationId,
                            verifyCode
                        );
                        await userCredential.user
                            .updatePhoneNumber(phoneCredential)
                            .then()
                            .catch((error) => {
                                userCredential.user.delete();
                                throw Error(error.code);
                            });

                        await userCredential.user.updateProfile({
                            displayName: currentUser.name,
                        });

                        await db
                            .collection("users")
                            .doc(currentUser.id)
                            .get()
                            .then(async (user) => {
                                if (!user.exists) {
                                    const data = {
                                        uid: currentUser.id,
                                        name: currentUser.name,
                                        phoneNumber: currentUser.phoneNumber,
                                        email: currentUser.email,
                                        permission: currentUser.permission,
                                        random: " ",
                                    };
                                    db.collection("users")
                                        .doc(currentUser.id)
                                        .set(data);
                                    db.collection("emails")
                                        .doc(currentUser.id)
                                        .set({
                                            email: currentUser.email,
                                        });
                                    db.collection("notifications")
                                        .doc(currentUser.id)
                                        .set({
                                            name: currentUser.name,
                                            expoToken: [],
                                        });
                                    if (isTrainer) {
                                        db.collection("users")
                                            .doc(currentUser.id)
                                            .update({
                                                className: "Need to Set Up",
                                            });
                                        const today = new Date();
                                        db.collection("users")
                                            .doc(currentUser.id)
                                            .collection("classes")
                                            .doc(
                                                today.getFullYear() +
                                                    "-" +
                                                    (today.getMonth() + 1 < 10
                                                        ? "0" +
                                                          (today.getMonth() + 1)
                                                        : today.getMonth() + 1)
                                            )
                                            .set({ date: [] });
                                    } else if (!isTrainer && !isAdmin) {
                                        const phoneId = currentUser.phoneNumber
                                            .split("-")
                                            .slice(1)
                                            .join("");
                                        console.log(phoneId);
                                        //await db.collection();
                                    }
                                }
                            })
                            .catch((error) => console.log(error));
                    })
                    .then(() => {
                        const user = myBase.auth().currentUser;
                        user.sendEmailVerification()
                            .then(() => {
                                console.log("Send Email");
                                Alert.alert(
                                    "Success",
                                    "Complete Sign Up\nCheck your email for verification!",
                                    [
                                        {
                                            text: "OK",
                                            onPress: () => {
                                                if (!isAdmin) {
                                                    pushNotificationsToAdmin(
                                                        "New Client",
                                                        "Signed Up",
                                                        {
                                                            navigation:
                                                                "FindUser",
                                                            datas: {
                                                                name: name,
                                                                phoneNumber: phoneNumber,
                                                            },
                                                        }
                                                    );
                                                }
                                            },
                                        },
                                    ]
                                );
                            })
                            .catch((error) => console.log(error));
                    })
                    .catch((error) => {
                        const errorCode = error.code;
                        const errorMessage = error.message;
                        if (errorCode === "auth/email-already-in-use") {
                            Alert.alert("Error", "Already used Email", [
                                { text: "OK" },
                            ]);
                        } else {
                            if (
                                errorMessage ===
                                "auth/invalid-verification-code"
                            ) {
                                Alert.alert("Error", "Wrong Code");
                            } else if (
                                errorMessage ===
                                "auth/credential-already-in-use"
                            ) {
                                Alert.alert(
                                    "Error",
                                    "Already Signed Up Phone Number"
                                );
                            } else {
                                Alert.alert(
                                    "Error",
                                    errorCode + "\n" + errorMessage,
                                    [{ text: "OK" }]
                                );
                            }
                            throw Error(errorMessage);
                        }
                        console.log(error);
                    });
            },
        }),
        []
    );
    return (
        <AuthContext.Provider value={authContext}>
            <NavigationContainer>
                <Stack.Navigator>
                    {state.isLoading ? (
                        <Stack.Screen
                            name="Loading"
                            component={LoadingScreen}
                            options={{ title: " " }}
                        />
                    ) : state.userToken == null ? (
                        <>
                            <Stack.Screen
                                name="signin"
                                component={SignIn}
                                options={{
                                    title: "Sign In",
                                    animationTypeForReplace: state.isSignout
                                        ? "pop"
                                        : "push",
                                }}
                            />
                            <Stack.Screen
                                name="resetpw"
                                component={ResetPw}
                                options={{
                                    title: "Reset Password",
                                    gestureEnabled: false,
                                    animationTypeForReplace: state.isSignout
                                        ? "pop"
                                        : "push",
                                }}
                            />
                            <Stack.Screen
                                name="signup"
                                component={SignUp}
                                options={{
                                    title: "Sign Up",
                                    gestureEnabled: false,
                                    animationTypeForReplace: state.isSignout
                                        ? "pop"
                                        : "push",
                                }}
                            />
                        </>
                    ) : (
                        <Stack.Screen
                            name="AuthSuccess"
                            component={AuthSuccess}
                            options={{
                                headerShown: false,
                                animationEnabled: false,
                            }}
                        />
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </AuthContext.Provider>
    );
}
