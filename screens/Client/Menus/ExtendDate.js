import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Keyboard,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import myBase, { db } from "../../../config/MyBase";
import { AuthStyles, MyStyles, TextSize } from "../../../css/MyStyles";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { pushNotificationsToAdmin } from "../../../config/MyExpo";
import { enToMiniKo } from "../../../config/hooks";
import SegmentedPicker from "react-native-segmented-picker";

export default ExtendDate = ({ navigation, route }) => {
    const uid = myBase.auth().currentUser.uid;
    const [availExtend, setAvailExtend] = useState([]);
    const [extendDate, setExtendDate] = useState({ date: "7" });
    const [extendReason, setExtendReason] = useState("");
    const picker = useRef();
    const dateList = [...Array(24).keys()].map((x) => ({
        label: (x + 7).toString(),
        value: (x + 7).toString(),
        key: (x + 7).toString(),
    }));

    useEffect(() => {
        const getMembsership = async () => {
            await db
                .collection("users")
                .doc(uid)
                .collection("extends")
                .orderBy("submitDate", "desc")
                .limit(1)
                .get()
                .then(async (docs) => {
                    let available = true;
                    docs.forEach((doc) => {
                        if (doc.data().confirm === false) {
                            available = false;
                        }
                    });
                    if (available) {
                        await db
                            .collection("users")
                            .doc(uid)
                            .collection("memberships")
                            .doc("list")
                            .get()
                            .then((doc) => {
                                let kinds = [];
                                if (doc.data().classes !== undefined) {
                                    kinds = doc.data().classes;
                                }
                                let kindsWithoutPt = kinds.slice();
                                const index = kindsWithoutPt.indexOf("pt");
                                if (index > -1) kindsWithoutPt.splice(index, 1);
                                return kindsWithoutPt;
                            })
                            .then(async (list) => {
                                if (list.length === 0) {
                                    Alert.alert(
                                        "경고",
                                        "연장 가능한 이용권이 없습니다.",
                                        [{ text: "확인" }],
                                        { cancelable: false }
                                    );
                                    navigation.goBack();
                                }
                                let temp = [];
                                const promises = list.map(async (kind) => {
                                    await db
                                        .collection("users")
                                        .doc(uid)
                                        .collection("memberships")
                                        .doc("list")
                                        .collection(kind)
                                        .orderBy("start", "desc")
                                        .limit(1)
                                        .get()
                                        .then((docs) => {
                                            docs.forEach((doc) => {
                                                if (
                                                    doc.data().start !== undefined &&
                                                    doc.data().month >= 6
                                                ) {
                                                    if (doc.data().extended === undefined) {
                                                        temp.push({
                                                            ...doc.data(),
                                                            remain: doc.data().month === 6 ? 1 : 2,
                                                        });
                                                    } else if (
                                                        doc.data().month === 12 &&
                                                        doc.data().extended === 1
                                                    ) {
                                                        temp.push({
                                                            ...doc.data(),
                                                            remain: 1,
                                                        });
                                                    }
                                                }
                                            });
                                        });
                                });
                                await Promise.all(promises);
                                if (temp.length === 0) {
                                    Alert.alert(
                                        "경고",
                                        "연장 가능한 이용권이 없습니다.",
                                        [{ text: "확인" }],
                                        { cancelable: false }
                                    );
                                    navigation.goBack();
                                } else {
                                    setAvailExtend(temp);
                                }
                            });
                    } else {
                        Alert.alert(
                            "경고",
                            "승인 대기 중입니다.\n승인 완료 후 신청해 주시기 바랍니다.",
                            [{ text: "확인" }],
                            { cancelable: false }
                        );
                        navigation.goBack();
                    }
                });
        };
        getMembsership();
    }, []);

    const onSubmit = async () => {
        let availList = [];
        const submitDate = new Date();
        availExtend.forEach((membership) => {
            const { name } = membership;
            availList.push(name);
        });
        await db
            .collection("users")
            .doc(uid)
            .collection("extends")
            .add({
                extendDate: Number(extendDate.date),
                extendReason: extendReason,
                confirm: false,
                submitDate: submitDate,
                extendMembership: availList,
            });
        let phoneNumber = myBase.auth().currentUser.phoneNumber;
        if (phoneNumber[1] === "1") {
            //test용 휴대폰번호
            phoneNumber = [
                phoneNumber.slice(1, 5),
                phoneNumber.slice(5, 8),
                phoneNumber.slice(8, phoneNumber.length),
            ].join("-");
        } else {
            phoneNumber = [
                "0" + phoneNumber.slice(3, 5),
                phoneNumber.slice(5, 9),
                phoneNumber.slice(9, phoneNumber.length),
            ].join("-");
        }
        await pushNotificationsToAdmin(
            myBase.auth().currentUser.displayName,
            "이용권 연장 신청",
            `${extendDate.date}일 연장 신청`,
            {
                navigation: "SelectUser",
                datas: {
                    name: myBase.auth().currentUser.displayName,
                    phoneNumber: phoneNumber,
                },
            }
        );
        Alert.alert(
            "성공",
            "연장 신청 완료",
            [{ text: "OK", onPress: () => navigation.goBack() }],
            { cancelable: false }
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, alignItems: "center" }}>
            <KeyboardAwareScrollView
                style={{ alignSelf: "stretch" }}
                contentContainerStyle={{ height: "100%" }}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                extraScrollHeight={80}
            >
                <TouchableOpacity
                    style={{ alignSelf: "stretch", height: "100%" }}
                    onPress={Keyboard.dismiss}
                    activeOpacity={1}
                >
                    <View style={{ paddingHorizontal: 20 }}>
                        <View style={[{ marginVertical: 15, padding: 15 }, MyStyles.buttonShadow]}>
                            <Text style={TextSize.largeSize}>연장 가능한 이용권</Text>
                            {availExtend.map((membership, index) => (
                                <View
                                    key={index}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginTop: 5,
                                    }}
                                >
                                    <MaterialIcons
                                        style={{ marginRight: 7 }}
                                        name="circle"
                                        size={RFPercentage(1.2)}
                                        color="black"
                                    />
                                    <Text style={[TextSize.normalSize, { flex: 2 }]}>
                                        {enToMiniKo(membership.name)}
                                    </Text>
                                    <Text style={[TextSize.normalSize, { flex: 2 }]}>
                                        {membership.month + "개월권"}
                                    </Text>
                                    <Text style={[TextSize.normalSize, { flex: 4 }]}>
                                        {moment(membership.end.toDate()).format("YYYY. MM. DD") +
                                            "까지"}
                                    </Text>
                                    <Text style={[TextSize.normalSize, { flex: 3 }]}>
                                        {membership.remain + "번 연장 가능"}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <View style={[MyStyles.buttonShadow, { padding: 15 }]}>
                            <Text style={TextSize.normalSize}>연장할 일수</Text>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    borderWidth: 1,
                                    marginTop: 5,
                                    marginBottom: 10,
                                }}
                            >
                                <View style={{ flex: 1, alignItems: "center" }}>
                                    <Text style={TextSize.largeSize}>{extendDate.date} 일동안</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        picker.current.show();
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name="chevron-down"
                                        size={30}
                                        color="black"
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={TextSize.normalSize}>연장 사유</Text>
                            <View
                                style={{
                                    borderWidth: 1,
                                    marginTop: 5,
                                    marginBottom: 10,
                                }}
                            >
                                <TextInput
                                    style={[AuthStyles.textInput, { borderWidth: 0 }]}
                                    keyboardType="default"
                                    placeholder="사유 30자 이내"
                                    value={extendReason}
                                    onChangeText={setExtendReason}
                                    maxLength={30}
                                    multiline={true}
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    [
                                        MyStyles.buttonShadow,
                                        {
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: 10,
                                        },
                                    ],
                                ]}
                                onPress={() => {
                                    Alert.alert(
                                        "확실합니까?",
                                        `연장 일수: ${extendDate.date}\n연장 사유: ${extendReason}`,
                                        [
                                            { text: "취소" },
                                            { text: "확인", onPress: () => onSubmit() },
                                        ],
                                        { cancelable: false }
                                    );
                                }}
                                disabled={!extendReason}
                            >
                                <Text style={[TextSize.normalSize, { margin: 10 }]}>제출</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </KeyboardAwareScrollView>
            <SegmentedPicker
                ref={picker}
                onCancel={(select) => {
                    setExtendDate({ date: select.date });
                }}
                onConfirm={(select) => {
                    setExtendDate({ date: select.date });
                }}
                defaultSelections={extendDate}
                options={[{ key: "date", items: dateList }]}
                confirmText="확인"
            />
        </SafeAreaView>
    );
};
