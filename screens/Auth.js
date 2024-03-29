import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { createContext, useEffect, useMemo, useReducer, useState } from "react";
import { Alert, Image, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import myBase, { arrayDelete, arrayUnion, db } from "../config/MyBase";
import firebase from "firebase";
import AuthSuccess from "./AuthSuccess";
import SignIn from "./Auth/SignIn";
import SignUp from "./Auth/SignUp";
import ResetPw from "./Auth/ResetPw";
import { pushNotificationsToAdmin } from "../config/MyExpo";
import { RFPercentage } from "react-native-responsive-fontsize";
import * as Crypto from "expo-crypto";
import { theme } from "../css/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import moment from "moment";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const Stack = createStackNavigator();

export const AuthContext = createContext();
export const DataContext = createContext();

export default Auth = () => {
    const [state, dispatch] = useReducer(
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
    const [classNames, setClassNames] = useState({});

    const restoreToken = async () => {
        let userToken;
        try {
            userToken = await AsyncStorage.getItem("userToken");
            return userToken;
        } catch (error) {
            console.log(error);
        }
    };

    const getter = async () => {
        await getClassNames().then(async () => {
            await restoreToken().then((token) => {
                dispatch({ type: "RESTORE_TOKEN", token: token });
            });
        });
    };

    useEffect(() => {
        getter();
    }, []);

    useEffect(() => {
        (async () => {
            if (!state.isLoading) {
                await SplashScreen.hideAsync().catch(console.warn);
            }
        })();
    }, [state.isLoading]);

    const getClassNames = async () => {
        let obj = {};
        await db
            .collection("classNames")
            .get()
            .then((names) => {
                names.forEach((name) => {
                    obj[name.id] = name.data();
                });
                setClassNames(obj);
            });
    };

    const dataContext = useMemo(() => ({ classNames: classNames }), [classNames]);

    const authContext = useMemo(
        () => ({
            signIn: async (data) => {
                const { email, password } = data;
                await myBase
                    .auth()
                    .signInWithEmailAndPassword(email, password)
                    .then(async (response) => {
                        await AsyncStorage.setItem("userToken", response.user.uid);
                        dispatch({ type: "SIGN_IN", token: response.user.uid });
                    })
                    .catch((error) => {
                        if (error.code === "auth/wrong-password") {
                            Alert.alert("경고", "잘못된 비밀번호입니다.", [{ text: "확인" }], {
                                cancelable: false,
                            });
                        } else if (error.code === "auth/invalid-email") {
                            Alert.alert("경고", "잘못된 이메일 형식입니다.", [{ text: "확인" }], {
                                cancelable: false,
                            });
                        } else if (error.code === "auth/user-not-found") {
                            Alert.alert("경고", "가입되지 않은 아이디입니다.", [{ text: "확인" }], {
                                cancelable: false,
                            });
                        } else {
                            Alert.alert("Error", error.message, [{ text: "확인" }], {
                                cancelable: false,
                            });
                        }
                        throw Error();
                    });
            },
            signOut: async () => {
                const token = await AsyncStorage.getItem("notificationToken");
                await db
                    .collection("notifications")
                    .doc(myBase.auth().currentUser.uid)
                    .update({ expoToken: arrayDelete(token) });
                myBase.auth().signOut();
                await AsyncStorage.multiRemove(["userToken", "notificationToken"]);
                dispatch({ type: "SIGN_OUT" });
            },
            signUp: async (data) => {
                const {
                    name,
                    phoneNumber,
                    userId,
                    password,
                    adminCode,
                    verificationId,
                    verifyCode,
                } = data;
                if (userId.length < 8) {
                    Alert.alert(
                        "경고",
                        "아이디는 8자 이상으로 해주시기 바랍니다.",
                        [{ text: "확인" }],
                        { cancelable: false }
                    );
                    return;
                }
                const adminDigest = await Crypto.digestStringAsync(
                    Crypto.CryptoDigestAlgorithm.SHA256,
                    adminCode
                );
                const keys = {};
                await db
                    .collection("keys")
                    .doc("admin")
                    .get()
                    .then((doc) => {
                        keys["admin"] = doc.data().key;
                    });
                await db
                    .collection("keys")
                    .doc("trainer")
                    .get()
                    .then((doc) => {
                        keys["trainer"] = doc.data().key;
                    });
                const isAdmin = adminDigest === keys.admin ? true : false;
                const isTrainer = adminDigest === keys.trainer ? true : false;
                await myBase
                    .auth()
                    .createUserWithEmailAndPassword(userId + "@test.com", password)
                    .then(async (userCredential) => {
                        const currentUser = {
                            id: userCredential.user.uid,
                            userId: userId,
                            name: name,
                            phoneNumber: phoneNumber,
                            permission: isAdmin ? 0 : isTrainer ? 1 : 2,
                            createdDate: new Date(userCredential.user.metadata.creationTime),
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
                                        id: currentUser.userId,
                                        permission: currentUser.permission,
                                        random: " ",
                                        memo: "",
                                        createdDate: currentUser.createdDate,
                                    };
                                    db.collection("users").doc(currentUser.id).set(data);
                                    db.collection("ids").doc(currentUser.id).set({
                                        id: currentUser.userId,
                                    });
                                    db.collection("notifications")
                                        .doc(currentUser.id)
                                        .set({
                                            name: currentUser.name,
                                            expoToken: [],
                                            admin: isAdmin === true,
                                            trainer: isTrainer === true,
                                        });
                                    if (isTrainer) {
                                        db.collection("users").doc(currentUser.id).update({
                                            className: "Need to Set Up",
                                        });
                                        const today = new Date();
                                        db.collection("users")
                                            .doc(currentUser.id)
                                            .collection("classes")
                                            .doc(moment(today).format("YYYY-MM"))
                                            .set({ date: [] });
                                    } else if (!isTrainer && !isAdmin) {
                                        const phoneId = currentUser.phoneNumber
                                            .split("-")
                                            .slice(1)
                                            .join("");
                                        await db
                                            .collection("users")
                                            .doc(currentUser.id)
                                            .collection("memberships")
                                            .doc("list")
                                            .set({
                                                classes: [],
                                            });
                                        await db
                                            .collection("temporary")
                                            .doc(phoneId)
                                            .get()
                                            .then(async (temp) => {
                                                if (temp.exists) {
                                                    if (temp.data().memo !== undefined) {
                                                        await db
                                                            .collection("users")
                                                            .doc(currentUser.id)
                                                            .update({ memo: temp.data().memo });
                                                    }
                                                }
                                                let classes = [];
                                                await temp.ref
                                                    .collection("memberships")
                                                    .doc("list")
                                                    .get()
                                                    .then((doc) => {
                                                        if (doc.data().classes !== undefined) {
                                                            classes = doc.data().classes;
                                                        }
                                                    });
                                                const promises = classes.map(async (name) => {
                                                    await temp.ref
                                                        .collection("memberships")
                                                        .doc("list")
                                                        .collection(name)
                                                        .get()
                                                        .then(async (docs) => {
                                                            let list = [];
                                                            let refs = [];
                                                            docs.forEach((doc) => {
                                                                let obj = doc.data();
                                                                list.push(obj);
                                                                refs.push(doc.ref);
                                                            });
                                                            const deletePromises = refs.map(
                                                                async (ref) => {
                                                                    await ref.delete();
                                                                }
                                                            );
                                                            await Promise.all(deletePromises);
                                                            await temp.ref
                                                                .collection("memberships")
                                                                .doc("list")
                                                                .delete();
                                                            return list;
                                                        })
                                                        .then(async (list) => {
                                                            await db
                                                                .collection("users")
                                                                .doc(currentUser.id)
                                                                .collection("memberships")
                                                                .doc("list")
                                                                .update({
                                                                    classes: arrayUnion(name),
                                                                });
                                                            const addPromises = list.map(
                                                                async (d) => {
                                                                    await db
                                                                        .collection("users")
                                                                        .doc(currentUser.id)
                                                                        .collection("memberships")
                                                                        .doc("list")
                                                                        .collection(name)
                                                                        .add(d);
                                                                }
                                                            );
                                                            await Promise.all(addPromises);
                                                        });
                                                });
                                                await Promise.all(promises);
                                                temp.ref.delete();
                                            });
                                    }
                                }
                            })
                            .catch((error) => console.log(error.code));
                    })
                    .then(() => {
                        Alert.alert(
                            "성공",
                            "회원가입이 완료되었습니다.",
                            [
                                {
                                    text: "확인",
                                    onPress: () => {
                                        if (!isAdmin && !isTrainer) {
                                            pushNotificationsToAdmin(
                                                name,
                                                "새로운 고객",
                                                "회원가입했습니다.",
                                                {
                                                    navigation: "FindUser",
                                                    datas: {
                                                        name: name,
                                                        phoneNumber: phoneNumber,
                                                    },
                                                }
                                            );
                                        }
                                    },
                                },
                            ],
                            { cancelable: false }
                        );
                    })
                    .catch((error) => {
                        const errorCode = error.code;
                        const errorMessage = error.message;
                        if (errorCode === "auth/email-already-in-use") {
                            Alert.alert("경고", "이미 사용된 이메일입니다.", [{ text: "확인" }], {
                                cancelable: false,
                            });
                        } else {
                            if (errorMessage === "auth/invalid-verification-code") {
                                Alert.alert("경고", "잘못된 인증 코드입니다.", [{ text: "확인" }], {
                                    cancelable: false,
                                });
                            } else if (errorMessage === "auth/credential-already-in-use") {
                                Alert.alert("경고", "이미 가입된 휴대폰번호입니다."),
                                    [{ text: "확인" }],
                                    { cancelable: false };
                            } else {
                                Alert.alert(
                                    "Error",
                                    errorCode + "\n" + errorMessage,
                                    [{ text: "확인" }],
                                    { cancelable: false }
                                );
                            }
                        }
                        throw Error(errorMessage);
                    });
            },
            errorHandle: async () => {
                const keys = await AsyncStorage.getAllKeys();
                if (keys.length > 0) await AsyncStorage.multiRemove(keys);
                dispatch({ type: "SIGN_OUT" });
            },
        }),
        []
    );

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

    const showSplash = () => {
        return (
            <View style={{ flex: 1 }}>
                <Image
                    source={require("../assets/splash.png")}
                    style={{
                        width: wp("100%"),
                        height: hp("100%"),
                    }}
                />
            </View>
        );
    };

    return (
        <AuthContext.Provider value={authContext}>
            <DataContext.Provider value={dataContext}>
                <NavigationContainer>
                    <Stack.Navigator
                        screenOptions={{
                            headerStyle: { backgroundColor: theme.colors.primary },
                            headerTitleStyle: { color: "white" },
                        }}
                    >
                        {state.isLoading ? (
                            <Stack.Screen
                                name="loading"
                                component={showSplash}
                                options={{ headerShown: false }}
                            />
                        ) : state.userToken === null ? (
                            <>
                                <Stack.Screen
                                    name="signin"
                                    component={SignIn}
                                    options={{
                                        headerShown: false,
                                        animationTypeForReplace: state.isSignout ? "pop" : "push",
                                    }}
                                />
                                <Stack.Screen
                                    name="resetpw"
                                    component={ResetPw}
                                    options={({ navigation }) => ({
                                        title: "비밀번호 초기화",
                                        gestureEnabled: false,
                                        animationTypeForReplace: state.isSignout ? "pop" : "push",
                                        headerLeft: () => renderGoBackButton(navigation),
                                    })}
                                />
                                <Stack.Screen
                                    name="signup"
                                    component={SignUp}
                                    options={({ navigation }) => ({
                                        title: "회원가입",
                                        gestureEnabled: false,
                                        animationTypeForReplace: state.isSignout ? "pop" : "push",
                                        headerLeft: () => renderGoBackButton(navigation),
                                    })}
                                />
                            </>
                        ) : (
                            <Stack.Screen
                                name="AuthSuccess"
                                component={AuthSuccess}
                                options={{
                                    headerShown: false,
                                }}
                            />
                        )}
                    </Stack.Navigator>
                </NavigationContainer>
            </DataContext.Provider>
        </AuthContext.Provider>
    );
};
