import React, { useContext, useEffect, useRef, useState } from "react";
import {
    SafeAreaView,
    Text,
    TouchableOpacity,
    Dimensions,
    View,
    Image,
    Modal,
    TextInput,
    Alert,
    Keyboard,
    Platform,
    ScrollView,
    AppState,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import myBase, { db } from "../../config/MyBase";
import { useInterval } from "../../config/hooks";
import { MyStyles, AuthStyles } from "../../css/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../Auth";
import { getStatusBarHeight } from "react-native-status-bar-height";
import firebase from "firebase";
import moment from "moment";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from "expo-firebase-recaptcha";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default Profile = ({ navigation }) => {
    const [data, setData] = useState("");
    const delay = 15000;
    const [isRun, setIsRun] = useState(false);
    const [num, setNum] = useState(4);
    const [count, setCount] = useState(15);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [name, setName] = useState("");
    const uid = myBase.auth().currentUser.uid;
    const [modalPhoneVisible, setModalPhoneVisible] = useState(false);
    const [changePhone, setChangePhone] = useState("");
    const { signOut } = useContext(AuthContext);
    const [modalEmailVisible, setModalEmailVisible] = useState(false);
    const [changeEmail, setChangeEmail] = useState("");
    const [password, setPassword] = useState("");
    const [checkEmail, setCheckEmail] = useState(false);
    const [chkUsedEmail, setChkUsedEmail] = useState(false);
    const [locker, setLocker] = useState(0);
    const thisuser = db.collection("users").doc(uid);
    const [membershipInfo, setMembershipInfo] = useState("");
    const [reservedClasses, setReservedClasses] = useState([]);
    const [canGenQR, setCanGenQR] = useState(false);
    const appVerifier = useRef(null);
    const [verificationId, setVerificationId] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [change, setChange] = useState(true);
    const [loading, setLoading] = useState(true);
    const [extendBool, setExtendBool] = useState({
        hasExtend: false,
        confirmExtend: false,
    });
    const { hasExtend, confirmExtend } = extendBool;

    const enToKo = (s) => {
        switch (s) {
            case "health":
                return "헬스";
            case "spinning":
                return "스피닝";
            case "GX":
                return "GX";
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

    const createRandom = async () => {
        if (uid !== null) {
            const rcode = Math.random().toString(36).substr(2, 7);
            await thisuser
                .get()
                .then((user) => {
                    if (user.exists) {
                        thisuser.update({
                            random: rcode,
                        });
                        console.log(rcode);
                        setData(uid + " " + rcode);
                    }
                })
                .catch((error) => console.log(error));
        }
    };

    const resetRandom = async () => {
        if (uid !== null) {
            await thisuser
                .get()
                .then((user) => {
                    if (user.exists) {
                        if (user.data().random !== " ") {
                            thisuser.update({
                                random: " ",
                            });
                        }
                    }
                })
                .catch((error) => console.log("reset random", error.code));
        }
    };

    const getUserData = async () => {
        if (uid !== null) {
            const storage_uid = await AsyncStorage.getItem("userToken");
            if (uid !== storage_uid) {
                signOut();
                return;
            }
            let kinds = [];
            let temp = {};
            setLoading(true);
            setName(myBase.auth().currentUser.displayName);
            let phoneNumber = myBase.auth().currentUser.phoneNumber;
            if (phoneNumber.slice(0, 3) === "+82") {
                phoneNumber =
                    "0" +
                    phoneNumber.slice(3, 5) +
                    "-" +
                    phoneNumber.slice(5, 9) +
                    "-" +
                    phoneNumber.slice(9, phoneNumber.length);
            }
            setPhoneNumber(phoneNumber);
            await db
                .collection("lockers")
                .where("uid", "==", uid)
                .get()
                .then((docs) => {
                    docs.forEach((doc) => {
                        setLocker(doc.id);
                    });
                });
            await thisuser
                .collection("memberships")
                .orderBy("end", "asc")
                .get()
                .then((snapshots) => {
                    const today = new Date();
                    snapshots.forEach((snapshot) => {
                        kinds.push(snapshot.id);
                        temp[snapshot.id] = snapshot.data();
                    });
                    let info = "";
                    let expiredNum = 0;
                    kinds.map((kind) => {
                        let stringTemp = enToKo(kind) + " : ";
                        if (kind === "pt") {
                            stringTemp = stringTemp + `${temp[kind].count}번 남음`;
                            if (temp[kind].count <= 0) {
                                expiredNum = expiredNum + 1;
                            }
                        } else {
                            stringTemp =
                                stringTemp +
                                (temp[kind].end.toDate() < today
                                    ? "만료됨"
                                    : `${temp[kind].month}개월권 (${moment(
                                          temp[kind].end.toDate()
                                      ).format("YYYY. MM. DD.")} 까지)`);
                            if (temp[kind].end.toDate() < today) {
                                expiredNum = expiredNum + 1;
                            }
                        }
                        info = info + stringTemp + "\n";
                    });
                    setMembershipInfo(
                        info ? info.substring(0, info.length - 1) : "회원권이 없습니다."
                    );
                    if (info && kinds.length !== expiredNum) {
                        setCanGenQR(true);
                    }
                });
            setExtendBool({ hasExtend: false, confirmExtend: false });
            await thisuser
                .collection("extends")
                .orderBy("submitDate", "desc")
                .limit(1)
                .get()
                .then((docs) => {
                    if (docs.size !== 0) {
                        kinds.forEach((kind) => {
                            if (temp[kind].extended !== undefined) {
                                docs.forEach((doc) => {
                                    setExtendBool({
                                        hasExtend: true,
                                        confirmExtend: doc.data().confirm,
                                    });
                                });
                            }
                        });
                    }
                });
            const today = new Date();
            const todayMonth = today.getMonth() + 1;
            const monthString =
                today.getFullYear() + "-" + (todayMonth < 10 ? "0" + todayMonth : todayMonth);
            try {
                const reserveDate = (
                    await thisuser.collection("reservation").doc(monthString).get()
                ).data().date;
                let reserved = [];
                reserveDate.sort((a, b) => {
                    return Number(a) - Number(b);
                });
                const promises = reserveDate.map(async (d) => {
                    if (today.getDate() <= Number(d)) {
                        await thisuser
                            .collection("reservation")
                            .doc(monthString)
                            .collection(d)
                            .orderBy("start", "asc")
                            .get()
                            .then((reservations) => {
                                reservations.forEach((reservation) => {
                                    const data = reservation.data();
                                    const start = data.start.toDate();
                                    const end = data.end.toDate();
                                    let c = {};
                                    c["cid"] = data.classId;
                                    c["className"] = data.className;
                                    c["classDate"] = monthString + "-" + (d < 10 ? "0" + d : d);
                                    c["trainer"] = data.trainer;
                                    c["startTime"] = moment(start).format("HH:mm");
                                    c["endTime"] = moment(end).format("HH:mm");
                                    if (data.className === "pt") {
                                        c["confirm"] = data.confirm;
                                    }
                                    reserved.push(c);
                                });
                            });
                    }
                });
                await Promise.all(promises);
                setReservedClasses(reserved);
            } catch (error) {
                setReservedClasses([]);
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isRun) {
            setNum(4);
            createRandom();
        }
    }, [isRun]);

    const changeAppState = (state) => {
        if (state === "inactive") {
            setIsRun(false);
            resetRandom();
        }
    };

    useEffect(() => {
        AppState.addEventListener("change", changeAppState);
        getUserData();
        return () => {
            AppState.removeEventListener("change", changeAppState);
        };
    }, [change]);

    useInterval(
        () => {
            setCount(15);
            if (num === 0) {
                setIsRun(false);
            } else {
                setNum(num - 1);
                createRandom();
            }
        },
        isRun ? delay : null
    );

    useInterval(
        () => {
            setCount(count === 0 ? 15 : count - 1);
        },
        isRun ? 1000 : null
    );

    useEffect(() => {
        setChangePhone(
            changePhone
                .replace(/[^0-9]/g, "")
                .replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3")
                .replace("--", "-")
        );
    }, [changePhone]);

    const sendCode = async () => {
        let profilePhone = "";
        if (changePhone[0] === "0") {
            profilePhone = "+82" + changePhone.split("-").join("").slice(1);
        } else if (changePhone[0] === "1") {
            //test phone number
            profilePhone = "+" + changePhone.split("-").join("");
        }
        const phoneProvider = new firebase.auth.PhoneAuthProvider();
        await phoneProvider.verifyPhoneNumber(profilePhone, appVerifier.current).then((id) => {
            setVerificationId(id);
            Alert.alert("성공", "인증 문자를 확인해주세요.", [{ text: "확인" }]);
        });
    };

    const dbChangePhone = async () => {
        const storage_uid = await AsyncStorage.getItem("userToken");
        if (uid === storage_uid) {
            const phoneCredential = firebase.auth.PhoneAuthProvider.credential(
                verificationId,
                verifyCode
            );
            await myBase
                .auth()
                .currentUser.updatePhoneNumber(phoneCredential)
                .then(async () => {
                    await thisuser
                        .get()
                        .then((user) => {
                            if (user.exists) {
                                thisuser.update({
                                    phoneNumber: changePhone,
                                });
                                Alert.alert("성공", "변경되었습니다.", [
                                    {
                                        text: "확인",
                                        onPress: () => {
                                            setChangePhone("");
                                            setChange(!change);
                                            setModalPhoneVisible(false);
                                        },
                                    },
                                ]);
                            }
                        })
                        .catch((error) => console.log(error));
                })
                .catch((error) => {
                    console.log(error.code, error.message);
                });
        } else {
            Alert.alert("경고", "이 계정은 당신 것이 아닙니다.", [{ text: "확인" }]);
            signOut();
        }
    };

    const chkEmail = (str) => {
        const reg_email = /^([0-9a-zA-Z_\.-]+)@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/;
        if (!reg_email.test(str)) {
            return false;
        } else {
            return true;
        }
    };

    useEffect(() => {
        setCheckEmail(chkEmail(changeEmail));
    }, [changeEmail]);

    const checkUsedEmail = async () => {
        if (changeEmail && checkEmail) {
            await db
                .collection("emails")
                .where("email", "==", changeEmail)
                .get()
                .then((snapshot) => {
                    let data = {};
                    snapshot.forEach((doc) => {
                        data = doc.data();
                    });
                    if (Object.keys(data).length === 0) {
                        setChkUsedEmail(true);
                        alert("Use your email");
                    } else {
                        alert("Alreay Used Email!");
                        setChangeEmail("");
                        setChkUsedEmail(false);
                    }
                })
                .catch((error) => console.log(error));
        } else if (!changeEmail) {
            alert("Input email");
        } else {
            alert("Wrong type of email");
        }
    };

    const dbChangeEmail = async () => {
        const storage_uid = await AsyncStorage.getItem("userToken");
        if (uid === storage_uid) {
            const credential = firebase.auth.EmailAuthProvider.credential(
                myBase.auth().currentUser.email,
                password
            );
            await myBase
                .auth()
                .currentUser.reauthenticateWithCredential(credential)
                .then(() => {
                    myBase.auth().currentUser.updateEmail(changeEmail);
                })
                .then(async () => {
                    const prev_email = db
                        .collection("emails")
                        .where("email", "==", myBase.auth().currentUser.email);
                    await prev_email
                        .get()
                        .then(async (snapshot) => {
                            let email_id = "";
                            snapshot.forEach((doc) => {
                                email_id = doc.id;
                            });
                            if (email_id === uid) {
                                await db.collection("emails").doc(uid).delete();
                            }
                        })
                        .then(async () => {
                            await db.collection("emails").doc(uid).set({ email: changeEmail });
                            await thisuser.get().then(async (user) => {
                                if (user.exists) {
                                    await thisuser.update({
                                        email: changeEmail,
                                    });
                                }
                            });
                            Alert.alert("성공", "변경되었습니다.", [
                                {
                                    text: "확인",
                                    onPress: () => {
                                        setChangeEmail("");
                                        setChkUsedEmail(false);
                                        signOut();
                                    },
                                },
                            ]);
                        });
                })
                .catch((error) => {
                    console.log(error.code, error.message);
                    Alert.alert("경고", "비밀번호가 틀립니다.", [
                        { text: "확인", onPress: () => setPassword("") },
                    ]);
                });
        } else {
            Alert.alert("경고", "이 계정은 당신 것이 아닙니다.", [
                {
                    text: "확인",
                },
            ]);
            signOut();
        }
    };

    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const widthImage = widthButton - 60;

    return (
        <SafeAreaView style={MyStyles.container}>
            <View style={{ flex: 1, justifyContent: "center" }}>
                <TouchableOpacity
                    style={[
                        MyStyles.button,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 15 },
                    ]}
                    onPress={() => {
                        if (canGenQR) {
                            setIsRun(!isRun);
                            setCount(15);
                        } else {
                            Alert.alert("경고", "회원권이 없습니다.");
                        }
                    }}
                >
                    {isRun ? (
                        <>
                            <View
                                style={{
                                    marginBottom: 10,
                                    alignItems: "center",
                                }}
                            >
                                {data.length > 0 ? (
                                    <QRCode
                                        value={data}
                                        size={200}
                                        bgColor="#000000"
                                        fgColor="#FFFFFF"
                                    />
                                ) : undefined}

                                <Text style={{ marginTop: 10, fontSize: RFPercentage(2.3) }}>
                                    유효시간 {isRun ? count : 0}초
                                </Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={{ fontSize: RFPercentage(2.5) }}>입장 코드 생성</Text>
                            <Image
                                style={[MyStyles.image, { width: widthImage }]}
                                source={require("../../assets/qrcode-test.png")}
                            />
                        </>
                    )}
                    {/*<TouchableOpacity
                        style={[MyStyles.backButton, MyStyles.buttonShadow, { borderRadius: 10 }]}
                        onPress={() => {
                            setIsRun(false);
                            navigation.goBack();
                        }}
                    >
                        <Text>뒤로가기</Text>
                    </TouchableOpacity>*/}
                </TouchableOpacity>
                <View style={[MyStyles.buttonShadow, { width: widthButton, height: "40%" }]}>
                    {loading ? (
                        <View
                            style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Image
                                style={{ width: 50, height: 50 }}
                                source={require("../../assets/loading.gif")}
                            />
                        </View>
                    ) : (
                        <View style={{ paddingBottom: 15 }}>
                            <ScrollView
                                style={{ padding: 15 }}
                                showsVerticalScrollIndicator={false}
                            >
                                <Modal
                                    animationType="slide"
                                    transparent={true}
                                    visible={modalPhoneVisible}
                                >
                                    <SafeAreaView
                                        style={{
                                            flex: 1,
                                            backgroundColor: "white",
                                        }}
                                    >
                                        <FirebaseRecaptchaVerifierModal
                                            ref={appVerifier}
                                            firebaseConfig={myBase.options}
                                            attemptInvisibleVerification={true}
                                        />
                                        <TouchableOpacity
                                            style={{
                                                position: "absolute",
                                                top:
                                                    Platform.OS === "ios"
                                                        ? getStatusBarHeight()
                                                        : 0,
                                                left: 0,
                                                margin: 10,
                                                padding: 5,
                                                zIndex: 1,
                                            }}
                                            onPress={() => {
                                                setChangePhone("");
                                                setModalPhoneVisible(!modalPhoneVisible);
                                            }}
                                        >
                                            <Text style={{ fontSize: RFPercentage(2) }}>닫기</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ flex: 1 }}
                                            onPress={Keyboard.dismiss}
                                            accessible={false}
                                            activeOpacity={1}
                                        >
                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            />
                                            <View
                                                style={{
                                                    flex: 8,
                                                    paddingHorizontal: 30,
                                                }}
                                            >
                                                <Text style={AuthStyles.text}>
                                                    변경할 휴대폰 번호
                                                </Text>
                                                <View
                                                    style={{
                                                        flexDirection: "row",
                                                        marginBottom: 10,
                                                    }}
                                                >
                                                    <TextInput
                                                        style={[
                                                            AuthStyles.textInput,
                                                            {
                                                                flex: 3,
                                                                marginRight: 7,
                                                            },
                                                        ]}
                                                        placeholder="010-0000-0000"
                                                        keyboardType="phone-pad"
                                                        autoCompleteType="tel"
                                                        textContentType="telephoneNumber"
                                                        value={changePhone}
                                                        onChangeText={setChangePhone}
                                                        maxLength={13}
                                                    />
                                                    <TouchableOpacity
                                                        style={AuthStyles.authButton}
                                                        onPress={() => sendCode()}
                                                        disabled={!changePhone}
                                                    >
                                                        <Text style={{ fontSize: RFPercentage(2) }}>
                                                            전송
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <View style={{ marginBottom: 10 }}>
                                                    {verificationId !== "" && (
                                                        <Text
                                                            style={{
                                                                marginBottom: 5,
                                                            }}
                                                        >
                                                            인증 코드 발송되었습니다.
                                                        </Text>
                                                    )}
                                                    <TextInput
                                                        style={AuthStyles.textInput}
                                                        placeholder="123456"
                                                        keyboardType="phone-pad"
                                                        maxLength={6}
                                                        editable={verificationId !== ""}
                                                        value={verifyCode}
                                                        onChangeText={setVerifyCode}
                                                        onChange={(e) => {
                                                            if (e.nativeEvent.text.length === 6) {
                                                                Keyboard.dismiss();
                                                            }
                                                        }}
                                                    />
                                                </View>
                                                <TouchableOpacity
                                                    style={[
                                                        MyStyles.buttonShadow,
                                                        {
                                                            height: hp("5%"),
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            borderRadius: 10,
                                                        },
                                                    ]}
                                                    onPress={() => {
                                                        if (verificationId !== "") {
                                                            dbChangePhone();
                                                        } else {
                                                            Alert.alert(
                                                                "경고",
                                                                "인증을 위한 문자 전송 버튼을 눌러주세요.",
                                                                [{ text: "확인" }]
                                                            );
                                                        }
                                                    }}
                                                    disabled={
                                                        !verificationId ||
                                                        !changePhone ||
                                                        !verifyCode
                                                    }
                                                >
                                                    <Text style={{ fontSize: RFPercentage(2) }}>
                                                        확인
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </TouchableOpacity>
                                        <View
                                            style={{
                                                width: "90%",
                                                alignItems: "center",
                                            }}
                                        >
                                            <FirebaseRecaptchaBanner />
                                        </View>
                                    </SafeAreaView>
                                </Modal>
                                <Modal
                                    animationType="slide"
                                    transparent={true}
                                    visible={modalEmailVisible}
                                >
                                    <SafeAreaView
                                        style={{
                                            flex: 1,
                                            backgroundColor: "white",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={{
                                                position: "absolute",
                                                top:
                                                    Platform.OS === "ios"
                                                        ? getStatusBarHeight()
                                                        : 0,
                                                left: 0,
                                                margin: 10,
                                                padding: 5,
                                                zIndex: 1,
                                            }}
                                            onPress={() => {
                                                setChangeEmail("");
                                                setChkUsedEmail(false);
                                                setModalEmailVisible(!modalEmailVisible);
                                            }}
                                        >
                                            <Text style={{ fontSize: RFPercentage(2) }}>닫기</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ flex: 1 }}
                                            onPress={Keyboard.dismiss}
                                            accessible={false}
                                            activeOpacity={1}
                                        >
                                            <View style={{ flex: 1 }} />
                                            <View
                                                style={{
                                                    flex: 8,
                                                    paddingHorizontal: 30,
                                                }}
                                            >
                                                <View style={AuthStyles.textView}>
                                                    <Text style={AuthStyles.text}>
                                                        변경할 이메일 주소
                                                    </Text>
                                                    <View
                                                        style={{
                                                            flexDirection: "row",
                                                        }}
                                                    >
                                                        <TextInput
                                                            style={[
                                                                AuthStyles.textInput,
                                                                changeEmail
                                                                    ? checkEmail
                                                                        ? {
                                                                              backgroundColor:
                                                                                  "green",
                                                                          }
                                                                        : {
                                                                              backgroundColor:
                                                                                  "red",
                                                                          }
                                                                    : undefined,
                                                                {
                                                                    flex: 3,
                                                                    marginRight: 7,
                                                                },
                                                            ]}
                                                            placeholder="examples@example.com"
                                                            keyboardType="email-address"
                                                            autoCompleteType="email"
                                                            textContentType="emailAddress"
                                                            value={changeEmail}
                                                            onChangeText={setChangeEmail}
                                                        />
                                                        <TouchableOpacity
                                                            style={AuthStyles.authButton}
                                                            onPress={() => checkUsedEmail()}
                                                            disabled={!changePhone}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: RFPercentage(2),
                                                                }}
                                                            >
                                                                중복확인
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                                <View style={AuthStyles.textView}>
                                                    <Text style={AuthStyles.text}>비밀번호</Text>
                                                    <TextInput
                                                        style={AuthStyles.textInput}
                                                        placeholder="Input password"
                                                        secureTextEntry={true}
                                                        value={password}
                                                        onChangeText={setPassword}
                                                    />
                                                </View>
                                                <TouchableOpacity
                                                    style={[
                                                        MyStyles.buttonShadow,
                                                        {
                                                            height: hp("5%"),
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            borderRadius: 10,
                                                        },
                                                    ]}
                                                    onPress={() => dbChangeEmail()}
                                                    disabled={
                                                        !changeEmail || !password || !chkUsedEmail
                                                    }
                                                >
                                                    <Text style={{ fontSize: RFPercentage(2) }}>
                                                        확인
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </TouchableOpacity>
                                    </SafeAreaView>
                                </Modal>
                                <Text style={MyStyles.profileText}>이름 : {name}</Text>
                                <View style={{ flexDirection: "row" }}>
                                    <Text style={[MyStyles.profileText, { flex: 9 }]}>
                                        휴대폰번호 : {phoneNumber}
                                    </Text>
                                    <TouchableOpacity
                                        style={{ flex: 1 }}
                                        onPress={() => {
                                            setModalPhoneVisible(true);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                MyStyles.profileText,
                                                {
                                                    textAlign: "right",
                                                    color: "#1e90ff",
                                                },
                                            ]}
                                        >
                                            변경
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: "row" }}>
                                    <Text style={[MyStyles.profileText, { flex: 9 }]}>
                                        이메일 : {myBase.auth().currentUser.email}
                                    </Text>
                                    <TouchableOpacity
                                        style={{ flex: 1 }}
                                        onPress={() => {
                                            setModalEmailVisible(true);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                MyStyles.profileText,
                                                {
                                                    textAlign: "right",
                                                    color: "#1e90ff",
                                                },
                                            ]}
                                        >
                                            변경
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={MyStyles.profileText}>
                                    보관함 번호 : {locker !== 0 ? locker : "없음"}
                                </Text>
                                <Text
                                    style={[
                                        MyStyles.profileText,
                                        {
                                            fontWeight: "bold",
                                            fontSize: RFPercentage(2.5),
                                        },
                                    ]}
                                >
                                    회원권 정보
                                    {hasExtend
                                        ? confirmExtend
                                            ? "(연장 승인 완료)"
                                            : "(연장 승인 대기중)"
                                        : undefined}
                                </Text>
                                {membershipInfo.split("\n").map((info, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            marginBottom: 1,
                                        }}
                                    >
                                        {info === "회원권이 없습니다." ? (
                                            <>
                                                <MaterialCommunityIcons
                                                    name="close-circle-outline"
                                                    size={20}
                                                    color="black"
                                                />
                                                <Text
                                                    style={{
                                                        fontSize: RFPercentage(2),
                                                        marginLeft: 3,
                                                    }}
                                                >
                                                    {info}
                                                </Text>
                                            </>
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons
                                                    name="check-circle-outline"
                                                    size={20}
                                                    color="black"
                                                />
                                                {info.split(":").map((s, i) => (
                                                    <Text
                                                        key={i}
                                                        style={[
                                                            {
                                                                fontSize: RFPercentage(2),
                                                                marginLeft: 3,
                                                            },
                                                            i === 0
                                                                ? {
                                                                      width: 52,
                                                                  }
                                                                : undefined,
                                                        ]}
                                                    >
                                                        {(i === 1 ? ":" : "") + s}
                                                    </Text>
                                                ))}
                                            </>
                                        )}
                                    </View>
                                ))}
                                <View style={{ marginTop: 3 }}>
                                    <Text
                                        style={[
                                            MyStyles.profileText,
                                            {
                                                fontWeight: "bold",
                                                fontSize: RFPercentage(2.5),
                                            },
                                        ]}
                                    >
                                        이번 달 수업 예약 정보
                                    </Text>
                                    {reservedClasses.length === 0 ? (
                                        <Text style={{ fontSize: RFPercentage(2), paddingLeft: 5 }}>
                                            예약된 수업이 없습니다.
                                        </Text>
                                    ) : null}
                                    {reservedClasses.map((reservedClass, index) => (
                                        <Text
                                            key={index}
                                            style={{
                                                fontSize: RFPercentage(2),
                                                marginBottom: 3,
                                            }}
                                        >
                                            {enToKo(reservedClass.className) +
                                                "(강사 " +
                                                reservedClass.trainer +
                                                ")"}{" "}
                                            {reservedClass.classDate}{" "}
                                            {reservedClass.startTime + "~" + reservedClass.endTime}
                                            {reservedClass.className === "pt"
                                                ? reservedClass.confirm
                                                    ? " (승인O)"
                                                    : " (승인X)"
                                                : null}
                                        </Text>
                                    ))}
                                </View>
                                <View style={{ height: 30 }}></View>
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};
