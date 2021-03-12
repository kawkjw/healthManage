import React, { useContext, useEffect, useRef, useState } from "react";
import {
    SafeAreaView,
    Text,
    TouchableOpacity,
    Dimensions,
    View,
    Image,
    TextInput,
    Alert,
    Keyboard,
    ScrollView,
    AppState,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import myBase, { db } from "../../config/MyBase";
import { useInterval } from "../../config/hooks";
import { MyStyles, AuthStyles, TextSize } from "../../css/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, DataContext } from "../Auth";
import firebase from "firebase";
import moment from "moment";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from "expo-firebase-recaptcha";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Modal from "react-native-modal";

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
    const { classNames } = useContext(DataContext);
    const [modalEmailVisible, setModalEmailVisible] = useState(false);
    const [changeEmail, setChangeEmail] = useState("");
    const [password, setPassword] = useState("");
    const [checkEmail, setCheckEmail] = useState(false);
    const [chkUsedEmail, setChkUsedEmail] = useState(false);
    const [locker, setLocker] = useState(0);
    const thisuser = db.collection("users").doc(uid);
    const [textWidth, setTextWidth] = useState(0);
    const [membershipInfo, setMembershipInfo] = useState("");
    const [reservedClasses, setReservedClasses] = useState([]);
    const [nextReservedClasses, setNextReservedClasses] = useState([]);
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
        const today = new Date();
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
                .doc("list")
                .get()
                .then((doc) => {
                    if (doc.data().classes !== undefined) {
                        kinds = doc.data().classes;
                    }
                    return kinds;
                })
                .then(async (list) => {
                    const promises = list.map(async (name) => {
                        await thisuser
                            .collection("memberships")
                            .doc("list")
                            .collection(name)
                            .orderBy("payDay", "desc")
                            .limit(1)
                            .get()
                            .then((docs) => {
                                docs.forEach((doc) => {
                                    if (doc.data().check === undefined) temp[name] = doc.data();
                                    else {
                                        const index = kinds.indexOf(name);
                                        kinds.splice(index, 1);
                                    }
                                });
                            });
                    });
                    await Promise.all(promises);

                    let info = "";
                    let expiredNum = 0;
                    kinds.map((kind) => {
                        let stringTemp =
                            (classNames[kind] !== undefined ? classNames[kind].ko : "Error") + ":";
                        if (kind === "pt" || kind === "squashpt") {
                            stringTemp =
                                stringTemp +
                                `${temp[kind].count < 0 ? 0 : temp[kind].count}번 남음 (트레이너 ${
                                    temp[kind].trainer
                                })`;
                            if (temp[kind].count <= 0) {
                                expiredNum = expiredNum + 1;
                            }
                        } else {
                            if (temp[kind].start !== undefined) {
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
                            } else {
                                stringTemp = stringTemp + "시작일 설정 필요";
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
                        setExtendBool({ ...extendBool, hasExtend: true });
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
            const monthString = moment(today).format("YYYY-MM");
            const nextMonthString = moment()
                .month(today.getMonth() + 1)
                .format("YYYY-MM");
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
                                    if (data.className === "pt" || data.className === "squashpt") {
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
            try {
                const reserveDate = (
                    await thisuser.collection("reservation").doc(nextMonthString).get()
                ).data().date;
                let reserved = [];
                reserveDate.sort((a, b) => {
                    return Number(a) - Number(b);
                });
                const promises = reserveDate.map(async (d) => {
                    await thisuser
                        .collection("reservation")
                        .doc(nextMonthString)
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
                                c["classDate"] = nextMonthString + "-" + (d < 10 ? "0" + d : d);
                                c["trainer"] = data.trainer;
                                c["startTime"] = moment(start).format("HH:mm");
                                c["endTime"] = moment(end).format("HH:mm");
                                if (data.className === "pt" || data.className === "squashpt") {
                                    c["confirm"] = data.confirm;
                                }
                                reserved.push(c);
                            });
                        });
                });
                await Promise.all(promises);
                setNextReservedClasses(reserved);
            } catch (error) {
                setNextReservedClasses([]);
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
        } else if (state === "active") {
            getUserData();
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
            Alert.alert("성공", "인증 문자를 확인해주세요.", [{ text: "확인" }], {
                cancelable: false,
            });
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
                                Alert.alert(
                                    "성공",
                                    "변경되었습니다.",
                                    [
                                        {
                                            text: "확인",
                                            onPress: () => {
                                                setChangePhone("");
                                                setChange(!change);
                                                setModalPhoneVisible(false);
                                            },
                                        },
                                    ],
                                    { cancelable: false }
                                );
                            }
                        })
                        .catch((error) => console.log(error));
                })
                .catch((error) => {
                    console.log(error.code, error.message);
                });
        } else {
            Alert.alert("경고", "이 계정은 당신 것이 아닙니다.", [{ text: "확인" }], {
                cancelable: false,
            });
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
                            Alert.alert(
                                "성공",
                                "변경되었습니다.",
                                [
                                    {
                                        text: "확인",
                                        onPress: () => {
                                            setChangeEmail("");
                                            setChkUsedEmail(false);
                                            signOut();
                                        },
                                    },
                                ],
                                { cancelable: false }
                            );
                        });
                })
                .catch((error) => {
                    console.log(error.code, error.message);
                    Alert.alert(
                        "경고",
                        "비밀번호가 틀립니다.",
                        [{ text: "확인", onPress: () => setPassword("") }],
                        { cancelable: false }
                    );
                });
        } else {
            Alert.alert(
                "경고",
                "이 계정은 당신 것이 아닙니다.",
                [
                    {
                        text: "확인",
                    },
                ],
                { cancelable: false }
            );
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
                            Alert.alert("경고", "회원권이 없습니다.", [{ text: "확인" }], {
                                cancelable: false,
                            });
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

                                <Text style={[TextSize.largeSize, { marginTop: 10 }]}>
                                    유효시간 {isRun ? count : 0}초
                                </Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={TextSize.largeSize}>입장 코드 생성</Text>
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
                                        TextSize.largeSize,
                                        {
                                            fontWeight: "bold",
                                        },
                                    ]}
                                >
                                    회원권 정보
                                    {hasExtend
                                        ? confirmExtend
                                            ? undefined
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
                                                    style={[
                                                        TextSize.normalSize,
                                                        {
                                                            marginLeft: 3,
                                                        },
                                                    ]}
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
                                                    style={{ marginRight: 3 }}
                                                />
                                                {info.split(":").map((s, i) => (
                                                    <View
                                                        key={i}
                                                        style={[
                                                            i === 0
                                                                ? textWidth !== 0
                                                                    ? {
                                                                          width: textWidth,
                                                                          alignItems: "flex-end",
                                                                      }
                                                                    : undefined
                                                                : undefined,
                                                        ]}
                                                        onLayout={({
                                                            nativeEvent: {
                                                                layout: { width },
                                                            },
                                                        }) => {
                                                            if (i === 0) {
                                                                if (textWidth < width)
                                                                    setTextWidth(width);
                                                            }
                                                        }}
                                                    >
                                                        <Text style={TextSize.normalSize}>
                                                            {(i === 1 ? ": " : "") + s}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </>
                                        )}
                                    </View>
                                ))}
                                <View style={{ marginTop: 3 }}>
                                    <Text
                                        style={[
                                            MyStyles.profileText,
                                            TextSize.largeSize,
                                            {
                                                fontWeight: "bold",
                                            },
                                        ]}
                                    >
                                        이번 달 수업 예약 정보
                                    </Text>
                                    {reservedClasses.length === 0 ? (
                                        <View
                                            style={{ flexDirection: "row", alignItems: "center" }}
                                        >
                                            <Ionicons
                                                name="close-circle-sharp"
                                                size={20}
                                                color="black"
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text style={TextSize.normalSize}>
                                                예약된 수업이 없습니다.
                                            </Text>
                                        </View>
                                    ) : null}
                                    {reservedClasses.map((reservedClass, index) => (
                                        <View key={index}>
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={20}
                                                    color="black"
                                                    style={{ marginRight: 4 }}
                                                />
                                                <Text style={TextSize.normalSize}>
                                                    {(classNames[reservedClass.className] !==
                                                    undefined
                                                        ? classNames[reservedClass.className].miniKo
                                                        : "Error") +
                                                        "(강사 " +
                                                        reservedClass.trainer +
                                                        ")"}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row", paddingLeft: 7 }}>
                                                <Ionicons
                                                    name="return-down-forward-sharp"
                                                    size={RFPercentage(2)}
                                                    color="black"
                                                    style={{ marginRight: 4 }}
                                                />
                                                <Text
                                                    style={[
                                                        TextSize.normalSize,
                                                        {
                                                            marginBottom: 3,
                                                        },
                                                    ]}
                                                >
                                                    {reservedClass.classDate}{" "}
                                                    {reservedClass.startTime +
                                                        "~" +
                                                        reservedClass.endTime}
                                                    {reservedClass.className === "pt" ||
                                                    reservedClass.className === "squashpt"
                                                        ? reservedClass.confirm
                                                            ? " (승인O)"
                                                            : " (승인X)"
                                                        : null}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                                <View style={{ marginTop: 3 }}>
                                    <Text
                                        style={[
                                            MyStyles.profileText,
                                            TextSize.largeSize,
                                            {
                                                fontWeight: "bold",
                                            },
                                        ]}
                                    >
                                        다음 달 수업 예약 정보
                                    </Text>
                                    {nextReservedClasses.length === 0 ? (
                                        <View
                                            style={{ flexDirection: "row", alignItems: "center" }}
                                        >
                                            <Ionicons
                                                name="close-circle-sharp"
                                                size={20}
                                                color="black"
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text style={TextSize.normalSize}>
                                                예약된 수업이 없습니다.
                                            </Text>
                                        </View>
                                    ) : null}
                                    {nextReservedClasses.map((reservedClass, index) => (
                                        <View key={index}>
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={20}
                                                    color="black"
                                                    style={{ marginRight: 4 }}
                                                />
                                                <Text style={TextSize.normalSize}>
                                                    {(classNames[reservedClass.className] !==
                                                    undefined
                                                        ? classNames[reservedClass.className].miniKo
                                                        : "Error") +
                                                        "(강사 " +
                                                        reservedClass.trainer +
                                                        ")"}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row", paddingLeft: 7 }}>
                                                <Ionicons
                                                    name="return-down-forward-sharp"
                                                    size={RFPercentage(2)}
                                                    color="black"
                                                    style={{ marginRight: 4 }}
                                                />
                                                <Text
                                                    style={[
                                                        TextSize.normalSize,
                                                        {
                                                            marginBottom: 3,
                                                        },
                                                    ]}
                                                >
                                                    {reservedClass.classDate}{" "}
                                                    {reservedClass.startTime +
                                                        "~" +
                                                        reservedClass.endTime}
                                                    {reservedClass.className === "pt" ||
                                                    reservedClass.className === "squashpt"
                                                        ? reservedClass.confirm
                                                            ? " (승인O)"
                                                            : " (승인X)"
                                                        : null}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                                <View style={{ height: 30 }}></View>
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>
            <Modal
                isVisible={modalPhoneVisible}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => setModalPhoneVisible(false)}
                onBackButtonPress={() => setModalPhoneVisible(false)}
                avoidKeyboard={true}
            >
                <View
                    style={{
                        height: hp("45%"),
                        backgroundColor: "white",
                    }}
                >
                    <View style={{ flexDirection: "row", height: hp("5%") }}>
                        <TouchableOpacity
                            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                            onPress={() => {
                                setChangePhone("");
                                setVerifyCode("");
                                setModalPhoneVisible(!modalPhoneVisible);
                            }}
                        >
                            <Text style={TextSize.largeSize}>닫기</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 7 }} />
                    </View>
                    <FirebaseRecaptchaVerifierModal
                        ref={appVerifier}
                        firebaseConfig={myBase.options}
                    />
                    <TouchableOpacity
                        style={{
                            alignSelf: "stretch",
                            height: hp("40%"),
                            paddingTop: 10,
                        }}
                        onPress={Keyboard.dismiss}
                        accessible={false}
                        activeOpacity={1}
                    >
                        <View
                            style={{
                                paddingHorizontal: 30,
                            }}
                        >
                            <Text style={AuthStyles.text}>변경할 휴대폰 번호</Text>
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
                                    <Text style={TextSize.normalSize}>전송</Text>
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
                                            [{ text: "확인" }],
                                            { cancelable: false }
                                        );
                                    }
                                }}
                                disabled={!verificationId || !changePhone || !verifyCode}
                            >
                                <Text style={TextSize.normalSize}>확인</Text>
                            </TouchableOpacity>
                        </View>
                        <View
                            style={{
                                width: "100%",
                                alignItems: "center",
                                marginTop: 20,
                            }}
                        >
                            <FirebaseRecaptchaBanner style={{ width: wp("85%") }} />
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
            <Modal
                isVisible={modalEmailVisible}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => setModalEmailVisible(false)}
                onBackButtonPress={() => setModalEmailVisible(false)}
                avoidKeyboard={true}
            >
                <View
                    style={{
                        height: hp("45%"),
                        backgroundColor: "white",
                    }}
                >
                    <View style={{ flexDirection: "row", height: hp("5%") }}>
                        <TouchableOpacity
                            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                            onPress={() => {
                                setChangeEmail("");
                                setChkUsedEmail(false);
                                setPassword("");
                                setModalEmailVisible(!modalEmailVisible);
                            }}
                        >
                            <Text style={TextSize.largeSize}>닫기</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 7 }} />
                    </View>
                    <TouchableOpacity
                        style={{ height: hp("40%"), marginTop: 10 }}
                        onPress={Keyboard.dismiss}
                        accessible={false}
                        activeOpacity={1}
                    >
                        <View
                            style={{
                                flex: 8,
                                paddingHorizontal: 30,
                            }}
                        >
                            <View style={AuthStyles.textView}>
                                <Text style={AuthStyles.text}>변경할 이메일 주소</Text>
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
                                                          backgroundColor: "green",
                                                      }
                                                    : {
                                                          backgroundColor: "red",
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
                                        <Text style={TextSize.normalSize}>중복확인</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={AuthStyles.textView}>
                                <Text style={AuthStyles.text}>비밀번호</Text>
                                <TextInput
                                    style={AuthStyles.textInput}
                                    placeholder="비밀번호 입력"
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
                                disabled={!changeEmail || !password || !chkUsedEmail}
                            >
                                <Text style={TextSize.normalSize}>확인</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};
