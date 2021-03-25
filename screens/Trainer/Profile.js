import React, { useContext, useEffect, useState } from "react";
import { Alert, Keyboard, Linking, SafeAreaView, TouchableOpacity, View } from "react-native";
import myBase, { arrayUnion, db } from "../../config/MyBase";
import { AuthContext, DataContext } from "../Auth";
import { MyStyles, TextSize } from "../../css/MyStyles";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Modal from "react-native-modal";
import { RFPercentage } from "react-native-responsive-fontsize";
import moment from "moment";
import { MaterialIcons } from "@expo/vector-icons";
import { Text, Button, Surface, TextInput, RadioButton } from "react-native-paper";

export default Profile = ({ navigation, route }) => {
    const today = new Date();

    const { signOut } = useContext(AuthContext);
    const { classNames } = useContext(DataContext);
    const uid = myBase.auth().currentUser !== null ? myBase.auth().currentUser.uid : null;
    const [userInfo, setUserInfo] = useState({
        name: "",
        id: "",
        phoneNumber: "",
        permission: 2,
        className: [],
    });
    const { name, id, phoneNumber, permission, className } = userInfo;
    const [modalSetClass, setModalSetClass] = useState(false);
    const [radioSelected, setRadioSelected] = useState(-1);
    const [ptStartTime, setPtStartTime] = useState("");
    const [ptEndTime, setPtEndTime] = useState("");
    const radioGxOptions = [
        { label: "스피닝", str: "spinning", value: 0 },
        { label: "스쿼시", str: "squash", value: 1 },
        { label: "필라테스", str: "pilates", value: 2 },
        { label: "GX", str: "yoga.zoomba", value: 3 },
    ];
    const [radioGxSelected, setRadioGxSelected] = useState(-1);
    const [todayClassInfo, setTodayClassInfo] = useState({});
    const [tomorrowClassInfo, setTomorrowClassInfo] = useState({});
    const [loading, setLoading] = useState(true);

    const getPTClass = async (date) => {
        let list = [];
        let tempList = [];
        await db
            .collection("users")
            .doc(uid)
            .collection("classes")
            .doc(moment(today).format("YYYY-MM"))
            .collection(date)
            .get()
            .then((snapshots) => {
                snapshots.forEach((snapshot) => {
                    let temp = {};
                    const { clientUid } = snapshot.data();
                    temp["time"] = snapshot.id;
                    temp["clientUid"] = clientUid;
                    tempList.push(temp);
                });
            });
        const promises = tempList.map(async (value) => {
            const { clientUid } = value;
            let temp = { ...value };
            const { name, phoneNumber } = (
                await db.collection("users").doc(clientUid).get()
            ).data();
            temp["clientName"] = name;
            temp["clientPhone"] = phoneNumber;
            list.push(temp);
        });
        await Promise.all(promises);
        return list;
    };

    const getGXClass = async (date, classList) => {
        const yearMonthStr = moment(today).format("YYYY-MM");
        let allList = {};
        const exec = classList.map(async (className) => {
            await db
                .collection("users")
                .doc(uid)
                .collection("classes")
                .doc(yearMonthStr)
                .collection("date")
                .doc(date)
                .get()
                .then(async (doc) => {
                    let classId = doc.data().list;
                    return classId;
                })
                .then(async (classId) => {
                    let list = [];
                    const promises = classId.map(async (id) => {
                        const classForId = db
                            .collection("classes")
                            .doc(className)
                            .collection("class")
                            .doc(yearMonthStr)
                            .collection(date)
                            .doc(id);
                        let classInfo = {};
                        classInfo["info"] = (await classForId.get()).data();
                        classInfo["name"] = className;
                        list.push(classInfo);
                    });
                    await Promise.all(promises);
                    list.sort((a, b) => {
                        return a.info.start.seconds - b.info.start.seconds;
                    });
                    allList[className] = list;
                });
        });
        await Promise.all(exec);
        return allList;
    };

    const getUserData = async () => {
        if (uid !== null) {
            setLoading(true);
            const thisuser = db.collection("users").doc(uid);
            await thisuser
                .get()
                .then((user) => {
                    if (user.exists) {
                        const userData = user.data();
                        if (userData.permission === 2) {
                            signOut();
                        } else {
                            setUserInfo({
                                ...userInfo,
                                name: userData.name,
                                phoneNumber: userData.phoneNumber,
                                id: userData.id,
                                className: userData.className.split("."),
                                permission: userData.permission,
                            });
                        }
                    }
                    return user.data().className.split(".");
                })
                .then(async (classNameList) => {
                    await thisuser
                        .collection("classes")
                        .doc(moment(today).format("YYYY-MM"))
                        .get()
                        .then(async (doc) => {
                            let date = [];
                            let ptDate = [];
                            if (doc.data().date !== undefined) {
                                date = doc.data().date;
                            }
                            if (doc.data().ptDate !== undefined) {
                                ptDate = doc.data().ptDate;
                            }
                            if (classNameList[0] === "pt") {
                                //pt
                                if (ptDate.indexOf(today.getDate().toString()) !== -1) {
                                    setTodayClassInfo({
                                        pt: await getPTClass(today.getDate().toString()),
                                    });
                                }
                                if (ptDate.indexOf((today.getDate() + 1).toString()) !== -1) {
                                    setTomorrowClassInfo({
                                        pt: await getPTClass((today.getDate() + 1).toString()),
                                    });
                                }
                            } else if (classNameList[0] === "gx") {
                                //gx
                                if (classNameList[1] === "squash") {
                                    //squash
                                    //today
                                    if (date.indexOf(today.getDate().toString()) !== -1) {
                                        setTodayClassInfo(
                                            await getGXClass(
                                                today.getDate().toString(),
                                                classNameList.slice(1)
                                            )
                                        );
                                    }
                                    if (ptDate.indexOf(today.getDate().toString()) !== -1) {
                                        setTodayClassInfo({
                                            ...todayClassInfo,
                                            squashpt: await getPTClass(today.getDate().toString()),
                                        });
                                    }
                                    //tomorrow
                                    if (date.indexOf((today.getDate() + 1).toString()) !== -1) {
                                        setTomorrowClassInfo(
                                            await getGXClass(
                                                (today.getDate() + 1).toString(),
                                                classNameList.slice(1)
                                            )
                                        );
                                    }
                                    if (ptDate.indexOf((today.getDate() + 1).toString()) !== -1) {
                                        setTomorrowClassInfo({
                                            ...tomorrowClassInfo,
                                            squashpt: await getPTClass(
                                                (today.getDate() + 1).toString()
                                            ),
                                        });
                                    }
                                } else {
                                    //gx except squash
                                    if (date.indexOf(today.getDate().toString()) !== -1) {
                                        setTodayClassInfo(
                                            await getGXClass(
                                                today.getDate().toString(),
                                                classNameList.slice(1)
                                            )
                                        );
                                    }
                                    if (date.indexOf((today.getDate() + 1).toString()) !== -1) {
                                        setTomorrowClassInfo(
                                            await getGXClass(
                                                (today.getDate() + 1).toString(),
                                                classNameList.slice(1)
                                            )
                                        );
                                    }
                                }
                            }
                        });
                })
                .then(() => setLoading(false))
                .catch((error) => {
                    setLoading(false);
                    console.log("Trainer Profile", error);
                });
        }
    };

    useEffect(() => {
        getUserData();
        if (route.params) {
            setModalSetClass(route.params.showModal);
        }
    }, []);

    const submitSetClass = async () => {
        if (radioSelected === 0) {
            if (Number(ptStartTime) >= Number(ptEndTime)) {
                Alert.alert("경고", "잘못된 범위의 시간입니다.", [{ text: "확인" }], {
                    cancelable: false,
                });
                return;
            } else if (Number(ptStartTime) < 8 || Number(ptEndTime) > 22) {
                Alert.alert("경고", "최소 : 8, 최대 : 22", [{ text: "확인" }], {
                    cancelable: false,
                });
                return;
            } else {
                let str =
                    "pt." +
                    (Number(ptStartTime) < 10 ? "0" + Number(ptStartTime) : Number(ptStartTime)) +
                    "." +
                    (Number(ptEndTime) < 10 ? "0" + Number(ptEndTime) : Number(ptEndTime));
                await db.collection("users").doc(uid).update({ className: str });
                await db
                    .collection("classes")
                    .doc("pt")
                    .update({ trainerList: arrayUnion(uid) });
                setModalSetClass(false);
                setUserInfo({ ...userInfo, className: str.split(".") });
            }
        } else if (radioSelected === 1) {
            if (radioGxSelected === -1) {
                Alert.alert("경고", "하나를 선택해주세요.", [{ text: "확인" }], {
                    cancelable: false,
                });
                return;
            } else if (radioGxSelected === 1) {
                if (Number(ptStartTime) >= Number(ptEndTime)) {
                    Alert.alert("경고", "잘못된 범위의 시간입니다.", [{ text: "확인" }], {
                        cancelable: false,
                    });
                    return;
                } else if (Number(ptStartTime) < 8 || Number(ptEndTime) > 22) {
                    Alert.alert("경고", "최소 : 8, 최대 : 22", [{ text: "확인" }], {
                        cancelable: false,
                    });
                    return;
                } else {
                    let str =
                        "gx.squash." +
                        (Number(ptStartTime) < 10
                            ? "0" + Number(ptStartTime)
                            : Number(ptStartTime)) +
                        "." +
                        (Number(ptEndTime) < 10 ? "0" + Number(ptEndTime) : Number(ptEndTime));
                    await db.collection("users").doc(uid).update({ className: str });
                    await db
                        .collection("classes")
                        .doc("squash")
                        .update({ trainerList: arrayUnion(uid) });
                    setModalSetClass(false);
                    setUserInfo({ ...userInfo, className: str.split(".") });
                }
            } else {
                let str = "gx." + radioGxOptions[radioGxSelected].str;
                await db.collection("users").doc(uid).update({ className: str });
                setModalSetClass(false);
                setUserInfo({ ...userInfo, className: str.split(".") });
            }
        }
    };

    const renderClass = (obj) => {
        const renderNoClass = (
            <Text
                style={[
                    TextSize.normalSize,
                    {
                        marginBottom: 5,
                        marginLeft: 7,
                    },
                ]}
            >
                수업이 없습니다.
            </Text>
        );

        const renderPTClass = (value, index) => (
            <View
                key={index}
                style={{
                    flexDirection: "row",
                    marginBottom: 5,
                    marginLeft: 7,
                }}
            >
                <MaterialIcons
                    name="circle"
                    size={RFPercentage(1.5)}
                    color="black"
                    style={{ alignSelf: "center" }}
                />
                <Text
                    style={[
                        TextSize.normalSize,
                        {
                            marginLeft: 5,
                        },
                    ]}
                >
                    {value.time + " " + value.clientName + " "}
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${value.clientPhone}`)}>
                    <Text
                        style={[
                            TextSize.normalSize,
                            {
                                color: "blue",
                            },
                        ]}
                    >
                        {value.clientPhone}
                    </Text>
                </TouchableOpacity>
            </View>
        );

        const renderGXClass = (value, index) => (
            <View
                key={index}
                style={{
                    flexDirection: "row",
                    marginBottom: 5,
                    marginLeft: 7,
                }}
            >
                <MaterialIcons
                    name="circle"
                    size={RFPercentage(1.5)}
                    color="black"
                    style={{ alignSelf: "center" }}
                />
                <Text
                    style={[
                        TextSize.normalSize,
                        {
                            marginLeft: 5,
                        },
                    ]}
                >
                    {(classNames[value.name] !== undefined ? classNames[value.name].ko : "Error") +
                        " "}
                    {moment(value.info.start.toDate()).format("HH:mm") +
                        " ~ " +
                        moment(value.info.end.toDate()).format("HH:mm") +
                        " " +
                        value.info.currentClient +
                        "/" +
                        value.info.maxClient}
                </Text>
            </View>
        );

        if (className[0] === "pt") {
            if (obj.pt === undefined) {
                return renderNoClass;
            } else {
                if (obj.pt.length === 0) {
                    return renderNoClass;
                }
                return obj.pt.map((value, index) => renderPTClass(value, index));
            }
        } else {
            if (className[1] === "squash") {
                return (
                    <View style={{ paddingLeft: 5 }}>
                        <Text>스쿼시 그룹</Text>
                        {obj.squash === undefined
                            ? renderNoClass
                            : obj.squash.map((value, index) => renderGXClass(value, index))}
                        <Text>스쿼시 PT</Text>
                        {obj.squashpt === undefined
                            ? renderNoClass
                            : obj.squashpt.map((value, index) => renderPTClass(value, index))}
                    </View>
                );
            }
            if (obj[className[1]] === undefined) {
                return renderNoClass;
            } else {
                if (obj[className[1]].length === 0) {
                    return renderNoClass;
                }
                let list = obj[className[1]];
                if (className[1] === "yoga") {
                    list.concat(obj[className[2]]);
                    list.sort((a, b) => {
                        return a.info.start.seconds - b.info.start.seconds;
                    });
                }
                return list.map((value, index) => renderGXClass(value, index));
            }
        }
    };

    return (
        <SafeAreaView style={[MyStyles.container, { justifyContent: "center" }]}>
            <Surface style={{ elevation: 6, borderRadius: 20, padding: 15 }}>
                <View style={{ width: wp("85%"), height: hp("80%") }}>
                    <Text style={MyStyles.profileText}>이름 : {name}</Text>
                    <Text style={MyStyles.profileText}>아이디 : {id}</Text>
                    <Text style={MyStyles.profileText}>휴대폰번호 : {phoneNumber}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={MyStyles.profileText}>담당 : </Text>
                        {className[0] === "Need to Set Up" ? (
                            <Button
                                mode="text"
                                compact={true}
                                onPress={() => {
                                    setPtStartTime("");
                                    setPtEndTime("");
                                    setRadioSelected(-1);
                                    setRadioGxSelected(-1);
                                    setModalSetClass(true);
                                }}
                                labelStyle={{
                                    marginVertical: 0,
                                    marginHorizontal: 0,
                                    color: "#1e90ff",
                                }}
                            >
                                여기를 눌러 설정해주세요.
                            </Button>
                        ) : (
                            <Text style={TextSize.normalSize}>
                                {classNames[className[0]] === undefined
                                    ? "Error"
                                    : classNames[className[0]].ko}
                                {className[0] === "pt"
                                    ? "(" + className[1] + ":00 ~ " + className[2] + ":00)"
                                    : className[0] === "gx"
                                    ? className[1] === "squash"
                                        ? "(" +
                                          (classNames[className[1]] !== undefined
                                              ? classNames[className[1]].ko
                                              : "Error") +
                                          "(" +
                                          className[2] +
                                          ":00 ~ " +
                                          className[3] +
                                          ":00)" +
                                          ")"
                                        : "(" +
                                          className
                                              .slice(1)
                                              .map((value) =>
                                                  classNames[value] !== undefined
                                                      ? classNames[value].ko
                                                      : "Error"
                                              )
                                              .join(", ") +
                                          ")"
                                    : null}
                            </Text>
                        )}
                        <Modal
                            isVisible={modalSetClass}
                            style={{ justifyContent: "flex-end", margin: 0 }}
                            onBackdropPress={() => setModalSetClass(false)}
                            onBackButtonPress={() => setModalSetClass(false)}
                            avoidKeyboard={true}
                        >
                            <TouchableOpacity
                                onPress={Keyboard.dismiss}
                                accessible={false}
                                activeOpacity={1}
                            >
                                <View
                                    style={{
                                        backgroundColor: "white",
                                        height: hp("30%"),
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: "row",
                                        }}
                                    >
                                        <Button mode="text" onPress={() => setModalSetClass(false)}>
                                            닫기
                                        </Button>
                                        <Button
                                            mode="text"
                                            style={{ position: "absolute", right: 0 }}
                                            onPress={() => {
                                                let gxStr = "";
                                                if (radioSelected === 1 && radioGxSelected !== -1) {
                                                    gxStr =
                                                        gxStr +
                                                        (classNames[
                                                            radioGxOptions[radioGxSelected].value
                                                        ] !== undefined
                                                            ? classNames[
                                                                  radioGxOptions[radioGxSelected]
                                                                      .value
                                                              ].ko
                                                            : radioGxOptions[radioGxSelected]
                                                                  .value === "yoga.zoomba"
                                                            ? "(요가, 줌바)"
                                                            : "Error");
                                                    if (radioGxSelected === 1) {
                                                        gxStr =
                                                            gxStr +
                                                            "(" +
                                                            `${Number(ptStartTime)}시부터 ${Number(
                                                                ptEndTime
                                                            )}시까지` +
                                                            ")";
                                                    }
                                                }
                                                Alert.alert(
                                                    (radioSelected === 0
                                                        ? "PT"
                                                        : radioSelected === 1
                                                        ? "GX"
                                                        : null) +
                                                        ":" +
                                                        (radioSelected === 0
                                                            ? `${Number(
                                                                  ptStartTime
                                                              )}시부터 ${Number(ptEndTime)}시까지`
                                                            : radioSelected === 1
                                                            ? gxStr
                                                            : null),
                                                    "확실합니까?",
                                                    [
                                                        { text: "취소" },
                                                        {
                                                            text: "확인",
                                                            onPress: () => submitSetClass(),
                                                        },
                                                    ],
                                                    { cancelable: false }
                                                );
                                            }}
                                        >
                                            확인
                                        </Button>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <RadioButton.Group
                                            value={radioSelected}
                                            onValueChange={(value) => setRadioSelected(value)}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <RadioButton value={0} color="#0099ff" />
                                                    <Button
                                                        mode="text"
                                                        onPress={() => {
                                                            setRadioSelected(0);
                                                            setRadioGxSelected(-1);
                                                            setPtStartTime("");
                                                            setPtEndTime("");
                                                        }}
                                                        labelStyle={{
                                                            marginHorizontal: 5,
                                                            marginVertical: 5,
                                                        }}
                                                        compact={true}
                                                    >
                                                        PT
                                                    </Button>
                                                </View>
                                                <View
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <RadioButton value={1} color="#0099ff" />
                                                    <Button
                                                        mode="text"
                                                        onPress={() => {
                                                            setRadioSelected(1);
                                                            setRadioGxSelected(-1);
                                                            setPtStartTime("");
                                                            setPtEndTime("");
                                                        }}
                                                        labelStyle={{
                                                            marginHorizontal: 5,
                                                            marginVertical: 5,
                                                        }}
                                                        compact={true}
                                                    >
                                                        GX
                                                    </Button>
                                                </View>
                                            </View>
                                        </RadioButton.Group>
                                        {radioSelected === 0 ? (
                                            <View
                                                style={{
                                                    marginVertical: 20,
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    paddingLeft: 40,
                                                }}
                                            >
                                                <TextInput
                                                    label="시작"
                                                    mode="outlined"
                                                    dense={true}
                                                    style={{ flex: 1 }}
                                                    value={ptStartTime}
                                                    onChangeText={setPtStartTime}
                                                    keyboardType="number-pad"
                                                    placeholder="00"
                                                    maxLength={2}
                                                />
                                                <Text
                                                    style={[
                                                        TextSize.largeSize,
                                                        {
                                                            flex: 1,
                                                            marginLeft: 5,
                                                        },
                                                    ]}
                                                >
                                                    시부터
                                                </Text>
                                                <TextInput
                                                    label="종료"
                                                    mode="outlined"
                                                    dense={true}
                                                    style={{ flex: 1 }}
                                                    value={ptEndTime}
                                                    onChangeText={setPtEndTime}
                                                    keyboardType="number-pad"
                                                    placeholder={"24"}
                                                    maxLength={2}
                                                />
                                                <Text
                                                    style={[
                                                        TextSize.largeSize,
                                                        {
                                                            flex: 1,
                                                            marginLeft: 5,
                                                        },
                                                    ]}
                                                >
                                                    시까지
                                                </Text>
                                            </View>
                                        ) : radioSelected === 1 ? (
                                            <View
                                                style={{
                                                    paddingHorizontal: 40,
                                                }}
                                            >
                                                <RadioButton.Group
                                                    value={radioGxSelected}
                                                    onValueChange={(value) =>
                                                        setRadioGxSelected(value)
                                                    }
                                                >
                                                    <View
                                                        style={{
                                                            flexDirection: "row",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                flexDirection: "row",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <RadioButton
                                                                value={0}
                                                                color="#0099ff"
                                                            />
                                                            <Button
                                                                mode="text"
                                                                onPress={() => {
                                                                    setRadioGxSelected(0);
                                                                }}
                                                                labelStyle={{
                                                                    marginHorizontal: 5,
                                                                    marginVertical: 5,
                                                                    fontSize: RFPercentage(2),
                                                                }}
                                                                compact={true}
                                                            >
                                                                스피닝
                                                            </Button>
                                                        </View>
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                flexDirection: "row",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <RadioButton
                                                                value={1}
                                                                color="#0099ff"
                                                            />
                                                            <Button
                                                                mode="text"
                                                                onPress={() => {
                                                                    setRadioGxSelected(1);
                                                                }}
                                                                labelStyle={{
                                                                    marginHorizontal: 5,
                                                                    marginVertical: 5,
                                                                    fontSize: RFPercentage(2),
                                                                }}
                                                                compact={true}
                                                            >
                                                                스쿼시
                                                            </Button>
                                                        </View>
                                                    </View>
                                                    <View
                                                        style={{
                                                            flexDirection: "row",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                flexDirection: "row",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <RadioButton
                                                                value={2}
                                                                color="#0099ff"
                                                            />
                                                            <Button
                                                                mode="text"
                                                                onPress={() => {
                                                                    setRadioGxSelected(2);
                                                                }}
                                                                labelStyle={{
                                                                    marginHorizontal: 5,
                                                                    marginVertical: 5,
                                                                    fontSize: RFPercentage(2),
                                                                }}
                                                                compact={true}
                                                            >
                                                                필라테스
                                                            </Button>
                                                        </View>
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                flexDirection: "row",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <RadioButton
                                                                value={3}
                                                                color="#0099ff"
                                                            />
                                                            <Button
                                                                mode="text"
                                                                onPress={() => {
                                                                    setRadioGxSelected(3);
                                                                }}
                                                                labelStyle={{
                                                                    marginHorizontal: 5,
                                                                    marginVertical: 5,
                                                                    fontSize: RFPercentage(2),
                                                                }}
                                                                compact={true}
                                                            >
                                                                GX
                                                            </Button>
                                                        </View>
                                                    </View>
                                                </RadioButton.Group>
                                                {radioGxSelected === 1 && (
                                                    <View style={{ paddingLeft: 20, marginTop: 5 }}>
                                                        <Text style={[TextSize.normalSize]}>
                                                            스쿼시 개인 수업 가능한 시간대
                                                        </Text>
                                                        <View
                                                            style={{
                                                                flexDirection: "row",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <TextInput
                                                                label="시작"
                                                                mode="outlined"
                                                                dense={true}
                                                                style={{ flex: 1 }}
                                                                value={ptStartTime}
                                                                onChangeText={setPtStartTime}
                                                                keyboardType="number-pad"
                                                                placeholder="00"
                                                                maxLength={2}
                                                            />
                                                            <Text
                                                                style={[
                                                                    TextSize.largeSize,
                                                                    {
                                                                        flex: 1,
                                                                        marginLeft: 5,
                                                                    },
                                                                ]}
                                                            >
                                                                시부터
                                                            </Text>
                                                            <TextInput
                                                                label="종료"
                                                                dense={true}
                                                                mode="outlined"
                                                                style={{ flex: 1 }}
                                                                value={ptEndTime}
                                                                onChangeText={setPtEndTime}
                                                                keyboardType="number-pad"
                                                                placeholder={"24"}
                                                                maxLength={2}
                                                            />
                                                            <Text
                                                                style={[
                                                                    TextSize.largeSize,
                                                                    {
                                                                        flex: 1,
                                                                        marginLeft: 5,
                                                                    },
                                                                ]}
                                                            >
                                                                시까지
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    </View>
                    {className[0] === "Need to Set Up" ? undefined : (
                        <View>
                            <Text style={TextSize.largeSize}>오늘 수업</Text>
                            {loading ? (
                                <Text
                                    style={[
                                        TextSize.normalSize,
                                        {
                                            marginBottom: 5,
                                            marginLeft: 7,
                                        },
                                    ]}
                                >
                                    로딩 중
                                </Text>
                            ) : (
                                renderClass(todayClassInfo)
                            )}
                            <Text style={TextSize.largeSize}>내일 수업</Text>
                            {loading ? (
                                <Text
                                    style={[
                                        TextSize.normalSize,
                                        {
                                            marginBottom: 5,
                                            marginLeft: 7,
                                        },
                                    ]}
                                >
                                    로딩 중
                                </Text>
                            ) : (
                                renderClass(tomorrowClassInfo)
                            )}
                        </View>
                    )}
                </View>
            </Surface>
        </SafeAreaView>
    );
};
