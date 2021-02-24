import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { createContext, useEffect, useMemo, useReducer } from "react";
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
import { ADMIN_CODE, TRAINER_CODE } from "@env";
import { pushNotificationsToAdmin } from "../config/MyExpo";
import { RFPercentage } from "react-native-responsive-fontsize";

const Stack = createStackNavigator();

export const AuthContext = createContext();

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

    useEffect(() => {
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
                            Alert.alert("경고", "잘못된 비밀번호입니다.", [{ text: "확인" }]);
                        } else if (error.code === "auth/invalid-email") {
                            Alert.alert("경고", "잘못된 이메일 형식입니다.", [{ text: "확인" }]);
                        } else if (error.code === "auth/user-not-found") {
                            Alert.alert("경고", "가입되지 않은 이메일입니다.", [{ text: "확인" }]);
                        } else {
                            Alert.alert("Error", error.message, [{ text: "확인" }]);
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
                    email,
                    password,
                    adminCode,
                    verificationId,
                    verifyCode,
                    sexSelected,
                    birthday,
                    address,
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
                                        email: currentUser.email,
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
                                    db.collection("emails").doc(currentUser.id).set({
                                        email: currentUser.email,
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
                                            .collection("temporary")
                                            .doc(phoneId)
                                            .get()
                                            .then(async (temp) => {
                                                const data = temp.data();
                                                const promises = data.memberships.map(
                                                    async (membership) => {
                                                        await db
                                                            .collection("users")
                                                            .doc(currentUser.id)
                                                            .collection("memberships")
                                                            .doc("list")
                                                            .update({
                                                                classes: arrayUnion(
                                                                    membership.name
                                                                ),
                                                            })
                                                            .catch(async () => {
                                                                await db
                                                                    .collection("users")
                                                                    .doc(currentUser.id)
                                                                    .collection("memberships")
                                                                    .doc("list")
                                                                    .set({
                                                                        classes: [membership.name],
                                                                    });
                                                            });
                                                        await db
                                                            .collection("users")
                                                            .doc(currentUser.id)
                                                            .collection("memberships")
                                                            .doc("list")
                                                            .collection(membership.name)
                                                            .add(membership);
                                                    }
                                                );
                                                await Promise.all(promises);
                                                temp.ref.delete();
                                            });
                                    }
                                }
                            })
                            .catch((error) => console.log(error.code));
                    })
                    .then(() => {
                        const user = myBase.auth().currentUser;
                        user.sendEmailVerification()
                            .then(() => {
                                console.log("Send Email");
                                Alert.alert(
                                    "성공",
                                    "회원가입이 완료되었습니다.\n인증 메일을 획인해주세요.",
                                    [
                                        {
                                            text: "확인",
                                            onPress: () => {
                                                if (!isAdmin) {
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
                                    ]
                                );
                            })
                            .catch((error) => console.log(error));
                    })
                    .catch((error) => {
                        const errorCode = error.code;
                        const errorMessage = error.message;
                        if (errorCode === "auth/email-already-in-use") {
                            Alert.alert("경고", "이미 사용된 이메일입니다.", [{ text: "확인" }]);
                        } else {
                            if (errorMessage === "auth/invalid-verification-code") {
                                Alert.alert("경고", "잘못된 인증 코드입니다.");
                            } else if (errorMessage === "auth/credential-already-in-use") {
                                Alert.alert("경고", "이미 가입된 휴대폰번호입니다.");
                            } else {
                                Alert.alert("Error", errorCode + "\n" + errorMessage, [
                                    { text: "확인" },
                                ]);
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

    return (
        <AuthContext.Provider value={authContext}>
            <NavigationContainer>
                <Stack.Navigator>
                    {state.isLoading ? (
                        <Stack.Screen
                            name="Loading"
                            component={LoadingScreen}
                            options={{ headerShown: false }}
                        />
                    ) : state.userToken == null ? (
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
                                animationEnabled: false,
                            }}
                        />
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </AuthContext.Provider>
    );
};
