import React, { useContext, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Keyboard,
    Linking,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import myBase, { arrayUnion, db } from "../../config/MyBase";
import { AuthContext, DataContext } from "../Auth";
import { AuthStyles, MyStyles, TextSize } from "../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import Modal from "react-native-modal";
import RadioForm, {
    RadioButton,
    RadioButtonInput,
    RadioButtonLabel,
} from "react-native-simple-radio-button";
import { RFPercentage } from "react-native-responsive-fontsize";
import moment from "moment";
import { MaterialIcons } from "@expo/vector-icons";

export default Profile = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const today = new Date();

    const { signOut } = useContext(AuthContext);
    const { classNames } = useContext(DataContext);
    const uid = myBase.auth().currentUser.uid;
    const [userInfo, setUserInfo] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        permission: 2,
        className: [],
    });
    const { name, email, phoneNumber, permission, className } = userInfo;
    const radioOptions = [
        { label: "PT", value: "pt" },
        { label: "GX", value: "gx" },
    ];
    const [modalSetClass, setModalSetClass] = useState(false);
    const [radioSelected, setRadioSelected] = useState(-1);
    const [ptStartTime, setPtStartTime] = useState("");
    const [ptEndTime, setPtEndTime] = useState("");
    const radioGxOptions = [
        { label: "스피닝", value: "spinning" },
        { label: "스쿼시", value: "squash" },
        { label: "필라테스", value: "pilates" },
        { label: "GX", value: "yoga.zoomba" },
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
                                email: userData.email,
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
                            const { date } = doc.data();
                            if (date.indexOf(today.getDate().toString()) !== -1) {
                                if (classNameList[0] === "pt") {
                                    setTodayClassInfo({
                                        pt: await getPTClass(today.getDate().toString()),
                                    });
                                } else if (classNameList[0] === "gx") {
                                    setTodayClassInfo(
                                        await getGXClass(
                                            today.getDate().toString(),
                                            classNameList.slice(1)
                                        )
                                    );
                                }
                            }
                            if (date.indexOf((today.getDate() + 1).toString()) !== -1) {
                                if (classNameList[0] === "pt") {
                                    setTomorrowClassInfo({
                                        pt: await getPTClass((today.getDate() + 1).toString()),
                                    });
                                } else if (classNameList[0] === "gx") {
                                    setTomorrowClassInfo(
                                        await getGXClass(
                                            (today.getDate() + 1).toString(),
                                            classNameList.slice(1)
                                        )
                                    );
                                }
                            }
                        });
                })
                .then(() => setLoading(false))
                .catch((error) => setLoading(false));
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
                Alert.alert("경고", "잘못된 범위의 시간입니다.");
                return;
            } else if (Number(ptStartTime) < 8 || Number(ptEndTime) > 22) {
                Alert.alert("경고", "최소 : 8, 최대 : 22");
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
                Alert.alert("경고", "하나를 선택해주세요.");
                return;
            } else if (radioGxSelected === 1) {
                if (Number(ptStartTime) >= Number(ptEndTime)) {
                    Alert.alert("경고", "잘못된 범위의 시간입니다.");
                    return;
                } else if (Number(ptStartTime) < 8 || Number(ptEndTime) > 22) {
                    Alert.alert("경고", "최소 : 8, 최대 : 22");
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
                let str = "gx." + radioGxOptions[radioGxSelected].value;
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
        if (className[0] === "pt") {
            if (obj.pt === undefined) {
                return renderNoClass;
            } else {
                if (obj.pt.length === 0) {
                    return renderNoClass;
                }
                return obj.pt.map((value, index) => (
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
                        <TouchableOpacity
                            onPress={() => Linking.openURL(`tel:${value.clientPhone}`)}
                        >
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
                ));
            }
        } else {
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
                return list.map((value, index) => (
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
                            {(classNames[value.name] !== undefined
                                ? classNames[value.name].ko
                                : "Error") + " "}
                            {moment(value.info.start.toDate()).format("HH:mm") +
                                " ~ " +
                                moment(value.info.end.toDate()).format("HH:mm") +
                                " " +
                                value.info.currentClient +
                                "/" +
                                value.info.maxClient}
                        </Text>
                    </View>
                ));
            }
        }
    };

    return (
        <SafeAreaView style={[MyStyles.container, { justifyContent: "center" }]}>
            <View
                style={[
                    MyStyles.buttonShadow,
                    { width: widthButton, height: hp("85%"), padding: 15 },
                ]}
            >
                <Text style={MyStyles.profileText}>이름 : {name}</Text>
                <Text style={MyStyles.profileText}>이메일 : {email}</Text>
                <Text style={MyStyles.profileText}>휴대폰번호 : {phoneNumber}</Text>
                <View style={{ flexDirection: "row" }}>
                    <Text style={MyStyles.profileText}>담당 : </Text>
                    <TouchableOpacity
                        onPress={() => {
                            setPtStartTime("");
                            setPtEndTime("");
                            setRadioSelected(-1);
                            setRadioGxSelected(-1);
                            setModalSetClass(true);
                        }}
                        disabled={className[0] !== "Need to Set Up"}
                    >
                        <Text
                            style={[
                                MyStyles.profileText,
                                className[0] === "Need to Set Up"
                                    ? { color: "#1e90ff" }
                                    : undefined,
                            ]}
                        >
                            {classNames[className[0]] !== undefined
                                ? classNames[className[0]].ko
                                : "여기를 눌러 설정해주세요."}
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
                    </TouchableOpacity>
                    <Modal
                        isVisible={modalSetClass}
                        style={{ justifyContent: "flex-end", margin: 0 }}
                        swipeDirection={["down"]}
                        onSwipeComplete={() => setModalSetClass(false)}
                        onBackdropPress={() => setModalSetClass(false)}
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
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            alignItems: "center",
                                        }}
                                        onPress={() => setModalSetClass(false)}
                                    >
                                        <Text style={[TextSize.normalSize, { margin: 7 }]}>
                                            닫기
                                        </Text>
                                    </TouchableOpacity>
                                    <View style={{ flex: 6 }} />
                                    <TouchableOpacity
                                        style={{
                                            alignItems: "center",
                                            flex: 1,
                                        }}
                                        onPress={() => {
                                            let gxStr = "";
                                            if (radioSelected === 1 && radioGxSelected !== -1) {
                                                gxStr =
                                                    gxStr +
                                                    (classNames[
                                                        radioGxOptions[radioGxSelected].value
                                                    ] !== undefined
                                                        ? classNames[
                                                              radioGxOptions[radioGxSelected].value
                                                          ].ko
                                                        : radioGxOptions[radioGxSelected].value ===
                                                          "yoga.zoomba"
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
                                                        ? `${Number(ptStartTime)}시부터 ${Number(
                                                              ptEndTime
                                                          )}시까지`
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
                                                ]
                                            );
                                        }}
                                    >
                                        <Text style={[TextSize.normalSize, { margin: 7 }]}>
                                            확인
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1, paddingVertical: 10 }}>
                                    <RadioForm formHorizontal={true} animation={true}>
                                        {radioOptions.map((option, index) => (
                                            <View key={index}>
                                                <RadioButton
                                                    labelHorizontal={true}
                                                    wrapStyle={{
                                                        marginLeft: 10,
                                                    }}
                                                >
                                                    <RadioButtonInput
                                                        obj={option}
                                                        index={index}
                                                        isSelected={radioSelected === index}
                                                        onPress={() => {
                                                            setRadioSelected(index);
                                                            setRadioGxSelected(-1);
                                                            setPtStartTime("");
                                                            setPtEndTime("");
                                                        }}
                                                        buttonSize={15}
                                                        buttonInnerColor={"black"}
                                                        buttonOuterColor={"black"}
                                                    />
                                                    <RadioButtonLabel
                                                        obj={option}
                                                        index={index}
                                                        onPress={() => {
                                                            setRadioSelected(index);
                                                            setRadioGxSelected(-1);
                                                            setPtStartTime("");
                                                            setPtEndTime("");
                                                        }}
                                                        labelStyle={{
                                                            fontSize: RFPercentage(2.2),
                                                            marginLeft: 5,
                                                        }}
                                                    />
                                                </RadioButton>
                                            </View>
                                        ))}
                                    </RadioForm>
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
                                                style={[AuthStyles.textInput, { flex: 1 }]}
                                                value={ptStartTime}
                                                onChangeText={setPtStartTime}
                                                keyboardType="number-pad"
                                                placeholder={"00"}
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
                                                style={[AuthStyles.textInput, { flex: 1 }]}
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
                                                paddingLeft: 40,
                                                marginVertical: 10,
                                            }}
                                        >
                                            <RadioForm formHorizontal={true} animation={true}>
                                                {radioGxOptions.slice(0, 2).map((option, index) => (
                                                    <View key={index}>
                                                        <RadioButton
                                                            labelHorizontal={true}
                                                            wrapStyle={{
                                                                marginLeft: 10,
                                                                marginRight: 25,
                                                                marginBottom: 5,
                                                            }}
                                                        >
                                                            <RadioButtonInput
                                                                obj={option}
                                                                index={index}
                                                                isSelected={
                                                                    radioGxSelected === index
                                                                }
                                                                onPress={() =>
                                                                    setRadioGxSelected(index)
                                                                }
                                                                buttonSize={15}
                                                                buttonInnerColor={"black"}
                                                                buttonOuterColor={"black"}
                                                            />
                                                            <RadioButtonLabel
                                                                obj={option}
                                                                index={index}
                                                                onPress={() =>
                                                                    setRadioGxSelected(index)
                                                                }
                                                                labelStyle={{
                                                                    fontSize: RFPercentage(2.2),
                                                                    marginLeft: 5,
                                                                }}
                                                            />
                                                        </RadioButton>
                                                    </View>
                                                ))}
                                            </RadioForm>
                                            <RadioForm formHorizontal={true} animation={true}>
                                                {radioGxOptions.slice(2, 4).map((option, index) => (
                                                    <View key={index + 2}>
                                                        <RadioButton
                                                            labelHorizontal={true}
                                                            wrapStyle={{
                                                                marginLeft: 10,
                                                                marginRight: 10,
                                                            }}
                                                        >
                                                            <RadioButtonInput
                                                                obj={option}
                                                                index={index + 2}
                                                                isSelected={
                                                                    radioGxSelected === index + 2
                                                                }
                                                                onPress={() =>
                                                                    setRadioGxSelected(index + 2)
                                                                }
                                                                buttonSize={15}
                                                                buttonInnerColor={"black"}
                                                                buttonOuterColor={"black"}
                                                            />
                                                            <RadioButtonLabel
                                                                obj={option}
                                                                index={index + 2}
                                                                onPress={() =>
                                                                    setRadioGxSelected(index + 2)
                                                                }
                                                                labelStyle={{
                                                                    fontSize: RFPercentage(2.2),
                                                                    marginLeft: 5,
                                                                }}
                                                            />
                                                        </RadioButton>
                                                    </View>
                                                ))}
                                            </RadioForm>
                                            {radioGxSelected === 1 && (
                                                <View style={{ paddingLeft: 20, marginTop: 5 }}>
                                                    <Text
                                                        style={[
                                                            TextSize.normalSize,
                                                            {
                                                                marginBottom: 5,
                                                            },
                                                        ]}
                                                    >
                                                        스쿼시 개인 수업 가능한 시간대
                                                    </Text>
                                                    <View
                                                        style={{
                                                            flexDirection: "row",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <TextInput
                                                            style={[
                                                                AuthStyles.textInput,
                                                                { flex: 1 },
                                                            ]}
                                                            value={ptStartTime}
                                                            onChangeText={setPtStartTime}
                                                            keyboardType="number-pad"
                                                            placeholder={"00"}
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
                                                            style={[
                                                                AuthStyles.textInput,
                                                                { flex: 1 },
                                                            ]}
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
        </SafeAreaView>
    );
};
