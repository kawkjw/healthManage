import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { createContext, useEffect, useMemo, useReducer, useState } from "react";
import { Alert, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import myBase, { arrayDelete, arrayUnion, db } from "../config/MyBase";
import firebase from "firebase";
import LoadingScreen from "./LoadingScreen";
import AuthSuccess from "./AuthSuccess";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SignIn from "./Auth/SignIn";
import SignUp from "./Auth/SignUp";
import ResetPw from "./Auth/ResetPw";
import { ADMIN_CODE, TRAINER_CODE } from "../config/secure";
import { pushNotificationsToAdmin } from "../config/MyExpo";
import { RFPercentage } from "react-native-responsive-fontsize";
import * as Crypto from "expo-crypto";
import { Appbar } from "react-native-paper";

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
                    .then((response) => {
                        AsyncStorage.setItem("userToken", response.user.uid);
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
                    sexSelected,
                    birthday,
                    address,
                } = data;
                const adminDigest = await Crypto.digestStringAsync(
                    Crypto.CryptoDigestAlgorithm.SHA256,
                    adminCode
                );
                const isAdmin = adminDigest === ADMIN_CODE ? true : false;
                const isTrainer = adminDigest === TRAINER_CODE ? true : false;
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
                            address: address,
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
                                        birthday: {
                                            year: birthday.year,
                                            month: birthday.month,
                                            day: birthday.day,
                                        },
                                        sex: sexSelected === 0 ? "남성" : "여성",
                                        address: currentUser.address,
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
                                                        .then((docs) => {
                                                            let list = [];
                                                            docs.forEach((doc) => {
                                                                let obj = doc.data();
                                                                list.push(obj);
                                                            });
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
            <MaterialIcons name="arrow-back-ios" size={RFPercentage(2.5)} color="black" />
        </TouchableOpacity>
    );

    const CustomNavBar = (props) => {
        const {
            navigation,
            previous,
            scene: {
                descriptor: {
                    options: { title },
                },
            },
        } = props;
        return (
            <Appbar.Header style={{ marginTop: 0 }}>
                {previous ? <Appbar.BackAction onPress={navigation.goBack} /> : null}
                <Appbar.Content title={title ? title : "My App"} />
            </Appbar.Header>
        );
    };

    return (
        <AuthContext.Provider value={authContext}>
            <DataContext.Provider value={dataContext}>
                <NavigationContainer>
                    <Stack.Navigator
                        screenOptions={{ header: (props) => <CustomNavBar {...props} /> }}
                    >
                        {state.isLoading ? (
                            <Stack.Screen
                                name="Loading"
                                component={LoadingScreen}
                                options={{ headerShown: false }}
                            />
                        ) : state.userToken === null ? (
                            <>
                                <Stack.Screen
                                    name="signin"
                                    component={SignIn}
                                    options={{
                                        title: "더끌림 피트니스",
                                        animationTypeForReplace: state.isSignout ? "pop" : "push",
                                    }}
                                />
                                <Stack.Screen
                                    name="resetpw"
                                    component={ResetPw}
                                    options={{
                                        title: "비밀번호 초기화",
                                        gestureEnabled: false,
                                        animationTypeForReplace: state.isSignout ? "pop" : "push",
                                    }}
                                />
                                <Stack.Screen
                                    name="signup"
                                    component={SignUp}
                                    options={{
                                        title: "회원가입",
                                        gestureEnabled: false,
                                        animationTypeForReplace: state.isSignout ? "pop" : "push",
                                    }}
                                />
                            </>
                        ) : (
                            <Stack.Screen
                                name="AuthSuccess"
                                component={AuthSuccess}
                                options={{
                                    headerShown: false,
                                    //animationEnabled: false,
                                }}
                            />
                        )}
                    </Stack.Navigator>
                </NavigationContainer>
            </DataContext.Provider>
        </AuthContext.Provider>
    );
};
