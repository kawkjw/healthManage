import React, { useContext, useEffect, useState } from "react";
import {
    SafeAreaView,
    Text,
    TouchableOpacity,
    Dimensions,
    View,
    Image,
    Modal,
    Button,
    TextInput,
    Alert,
    Keyboard,
    Platform,
    ScrollView,
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

export default Profile = ({ navigation }) => {
    const [data, setData] = useState("");
    const [delay, setDelay] = useState(15000);
    const [isRun, setIsRun] = useState(false);
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
                    }
                })
                .catch((error) => console.log(error));
        }
    };
    const getRandom = async () => {
        if (uid !== null) {
            await thisuser.get().then((user) => {
                if (user.exists) {
                    console.log(user.data().random);
                    setData(uid + " " + user.data().random);
                }
            });
        }
    };
    const getUserData = async () => {
        if (uid !== null) {
            const storage_uid = await AsyncStorage.getItem("userToken");
            if (uid !== storage_uid) {
                signOut();
            }
            let kinds = [];
            let temp = {};
            await thisuser.get().then((user) => {
                if (user.exists) {
                    setPhoneNumber(user.data().phoneNumber);
                    setName(user.data().name);
                }
            });
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
                    snapshots.forEach((snapshot) => {
                        kinds.push(snapshot.id);
                        temp[snapshot.id] = snapshot.data();
                    });
                    let info = "";
                    kinds.map((kind) => {
                        let stringTemp = enToKo(kind) + " : ";
                        if (kind === "pt") {
                            stringTemp =
                                stringTemp +
                                `${temp[kind].count}번 남음 (트레이너: ${temp[kind].trainer})`;
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
                        info
                            ? info.substring(0, info.length - 1)
                            : "회원권이 없습니다."
                    );
                });
            const today = new Date();
            const todayMonth = today.getMonth() + 1;
            const monthString =
                today.getFullYear() +
                "-" +
                (todayMonth < 10 ? "0" + todayMonth : todayMonth);
            try {
                const reserveDate = (
                    await thisuser
                        .collection("reservation")
                        .doc(monthString)
                        .get()
                ).data().date;
                let reserved = [];
                await reserveDate.sort().forEach(async (d) => {
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
                                    c["classDate"] =
                                        monthString +
                                        "-" +
                                        (d < 10 ? "0" + d : d);
                                    c["trainer"] = data.trainer;
                                    c["startTime"] =
                                        (start.getHours() < 10
                                            ? "0" + start.getHours()
                                            : start.getHours()) +
                                        ":" +
                                        (start.getMinutes() === 0
                                            ? "00"
                                            : start.getMinutes());
                                    c["endTime"] =
                                        (end.getHours() < 10
                                            ? "0" + end.getHours()
                                            : end.getHours()) +
                                        ":" +
                                        (end.getMinutes() === 0
                                            ? "00"
                                            : end.getMinutes());
                                    if (data.className === "pt") {
                                        c["confirm"] = data.confirm;
                                    }
                                    reserved.push(c);
                                });
                            });
                    }
                });
                setTimeout(() => setReservedClasses(reserved), 300);
            } catch (error) {
                console.log(error.code, error.message);
            }
        }
    };

    useEffect(() => {
        if (isRun) {
            createRandom();
            setTimeout(getRandom, 700);
        }
    }, [isRun]);

    useEffect(() => {
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
                    .catch((error) => console.log(error));
            }
        };
        getUserData();
        return () => {
            if (myBase.auth().currentUser) resetRandom();
        };
    }, []);

    useInterval(
        () => {
            createRandom();
            setTimeout(getRandom, 700);
            setTimeout(() => {
                setCount(15);
            }, 700);
        },
        isRun ? delay : null
    );

    useInterval(
        () => {
            setCount(count - 1);
        },
        isRun ? 1000 : null
    );

    useEffect(() => {
        setChangePhone(
            changePhone
                .replace(/[^0-9]/g, "")
                .replace(
                    /(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,
                    "$1-$2-$3"
                )
                .replace("--", "-")
        );
    }, [changePhone]);

    const dbChangePhone = async () => {
        const storage_uid = await AsyncStorage.getItem("userToken");
        if (uid === storage_uid) {
            await thisuser
                .get()
                .then((user) => {
                    if (user.exists) {
                        thisuser.update({
                            phoneNumber: changePhone,
                        });
                        Alert.alert("Success", "Update Success", [
                            {
                                text: "OK",
                                onPress: () => {
                                    setChangePhone("");
                                    setModalPhoneVisible(false);
                                },
                            },
                        ]);
                    }
                })
                .catch((error) => console.log(error));
        } else {
            Alert.alert("Error", "This account is not yours", [{ text: "OK" }]);
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
                            await db
                                .collection("emails")
                                .doc(uid)
                                .set({ email: changeEmail });
                            await thisuser.get().then(async (user) => {
                                if (user.exists) {
                                    await thisuser.update({
                                        email: changeEmail,
                                    });
                                }
                            });
                            Alert.alert("Success", "Changed Email", [
                                {
                                    text: "OK",
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
                    Alert.alert("Error", "Wrong Password", [
                        { text: "OK", onPress: () => setPassword("") },
                    ]);
                });
        } else {
            Alert.alert("Error", "This account is not yours", [
                {
                    text: "OK",
                    onPress: () => {
                        signOut();
                    },
                },
            ]);
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
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => {
                        setIsRun(!isRun);
                        setCount(15);
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
                                <QRCode
                                    value={data.length > 0 ? data : "a"}
                                    size={200}
                                    bgColor="#000000"
                                    fgColor="#FFFFFF"
                                />
                                <Text style={{ marginTop: 10 }}>
                                    유효시간 {isRun ? count : 0}초
                                </Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text>Generate QR Code</Text>
                            <Image
                                style={[MyStyles.image, { width: widthImage }]}
                                source={require("../../assets/qrcode-test.png")}
                            />
                        </>
                    )}
                    <TouchableOpacity
                        style={[
                            MyStyles.backButton,
                            MyStyles.buttonShadow,
                            { borderRadius: 10 },
                        ]}
                        onPress={() => {
                            setIsRun(false);
                            navigation.goBack();
                        }}
                    >
                        <Text>뒤로가기</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
                <View
                    style={[
                        MyStyles.buttonShadow,
                        { width: widthButton, height: "45%" },
                    ]}
                >
                    <ScrollView style={{ padding: 15 }}>
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
                                <TouchableOpacity
                                    style={{
                                        position: "absolute",
                                        top:
                                            Platform.OS === "ios"
                                                ? getStatusBarHeight()
                                                : 0,
                                        left: 5,
                                        margin: 10,
                                        padding: 5,
                                        zIndex: 1,
                                    }}
                                    onPress={() => {
                                        setChangePhone("");
                                        setModalPhoneVisible(
                                            !modalPhoneVisible
                                        );
                                    }}
                                >
                                    <Text style={{ fontSize: 17 }}>Close</Text>
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
                                            Enter Change Phone Number
                                        </Text>
                                        <TextInput
                                            style={AuthStyles.textInput}
                                            placeholder="010-0000-0000"
                                            keyboardType="phone-pad"
                                            autoCompleteType="tel"
                                            textContentType="telephoneNumber"
                                            value={changePhone}
                                            onChangeText={setChangePhone}
                                            maxLength={13}
                                        />
                                        <Button
                                            title="Submit"
                                            onPress={() => {
                                                if (changePhone.length === 13) {
                                                    dbChangePhone();
                                                } else {
                                                    Alert.alert(
                                                        "Error",
                                                        "Input correct phone Number",
                                                        [{ text: "OK" }]
                                                    );
                                                }
                                            }}
                                        />
                                    </View>
                                </TouchableOpacity>
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
                                        left: 5,
                                        margin: 10,
                                        padding: 5,
                                        zIndex: 1,
                                    }}
                                    onPress={() => {
                                        setChangeEmail("");
                                        setChkUsedEmail(false);
                                        setModalEmailVisible(
                                            !modalEmailVisible
                                        );
                                    }}
                                >
                                    <Text style={{ fontSize: 17 }}>Close</Text>
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
                                                Enter Change Email
                                            </Text>
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
                                                ]}
                                                placeholder="examples@example.com"
                                                keyboardType="email-address"
                                                autoCompleteType="email"
                                                textContentType="emailAddress"
                                                value={changeEmail}
                                                onChangeText={setChangeEmail}
                                            />
                                        </View>
                                        <Button
                                            title="Check Email"
                                            onPress={checkUsedEmail}
                                        />
                                        <View style={AuthStyles.textView}>
                                            <Text style={AuthStyles.text}>
                                                Enter Password
                                            </Text>
                                            <TextInput
                                                style={AuthStyles.textInput}
                                                placeholder="Input password"
                                                secureTextEntry={true}
                                                value={password}
                                                onChangeText={setPassword}
                                            />
                                        </View>
                                        <Button
                                            title="Submit"
                                            onPress={dbChangeEmail}
                                            disabled={
                                                !changeEmail ||
                                                !password ||
                                                !chkUsedEmail
                                            }
                                        />
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
                                { fontWeight: "bold", fontSize: 20 },
                            ]}
                        >
                            회원권 정보
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
                                                fontSize: 17,
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
                                                        fontSize: 17,
                                                        marginLeft: 3,
                                                    },
                                                    i === 0
                                                        ? { width: 52 }
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
                                    { fontWeight: "bold", fontSize: 20 },
                                ]}
                            >
                                이번 달 수업 예약 정보
                            </Text>
                            {reservedClasses.length === 0 ? (
                                <Text> 예약된 수업이 없습니다.</Text>
                            ) : null}
                            {reservedClasses.map((reservedClass, index) => (
                                <Text
                                    key={index}
                                    style={{ fontSize: 17, marginBottom: 3 }}
                                >
                                    {enToKo(reservedClass.className) +
                                        "(강사 " +
                                        reservedClass.trainer +
                                        ")"}{" "}
                                    {reservedClass.classDate}{" "}
                                    {reservedClass.startTime +
                                        "~" +
                                        reservedClass.endTime}
                                    {reservedClass.className === "pt"
                                        ? reservedClass.confirm
                                            ? " (승인완료)"
                                            : " (승인대기중)"
                                        : null}
                                </Text>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
};
