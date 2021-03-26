import React, { useContext, useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../../config/MyBase";
import moment from "moment";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { pushNotificationsToPerson } from "../../../config/MyExpo";
import { DataContext } from "../../Auth";
import { ActivityIndicator, Surface } from "react-native-paper";

export default ShowUser = ({ route }) => {
    const { classNames } = useContext(DataContext);
    const { user } = route.params;
    const today = new Date();
    const [isLoading, setIsLoading] = useState(true);
    const [membership, setMembership] = useState({});
    const [membershipKinds, setMembershipKinds] = useState([]);
    const [extendList, setExtendList] = useState([]);
    const [change, setChange] = useState(false);
    const [textWidth, setTextWidth] = useState(0);

    const getMembership = async () => {
        await db
            .collection("users")
            .doc(user.uid)
            .collection("memberships")
            .doc("list")
            .get()
            .then((doc) => {
                let kinds = [];
                if (doc.data().classes !== undefined) {
                    kinds = doc.data().classes;
                }
                return kinds;
            })
            .then(async (kinds) => {
                let temp = {};
                const promises = kinds.map(async (kind) => {
                    await db
                        .collection("users")
                        .doc(user.uid)
                        .collection("memberships")
                        .doc("list")
                        .collection(kind)
                        .orderBy("payDay", "desc")
                        .limit(1)
                        .get()
                        .then((docs) => {
                            docs.forEach((doc) => {
                                temp[kind] = doc.data();
                            });
                        });
                });
                await Promise.all(promises);
                setMembershipKinds(kinds);
                setMembership(temp);
            })
            .catch((error) => {
                console.log("ShowUser", error);
            });
    };

    const getExtends = async () => {
        await db
            .collection("users")
            .doc(user.uid)
            .collection("extends")
            .orderBy("submitDate", "desc")
            .get()
            .then((docs) => {
                let list = [];
                docs.forEach((doc) => {
                    list.push({ ...doc.data(), id: doc.id });
                });
                setExtendList(list);
            });
    };

    const getter = async () => {
        setIsLoading(true);
        await getMembership().then(async () => {
            await getExtends().then(() => {
                setIsLoading(false);
            });
        });
    };

    const renderMembership = (kind, key) => {
        if (kind === "pt" || kind === "squashpt") {
            return (
                <View
                    key={key}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 1,
                    }}
                >
                    <MaterialCommunityIcons
                        name="check-circle-outline"
                        size={RFPercentage(2)}
                        color="black"
                        style={{ marginRight: 3 }}
                    />
                    <View
                        style={[
                            { alignItems: "flex-end" },
                            textWidth !== 0 ? { width: textWidth } : undefined,
                        ]}
                        onLayout={({
                            nativeEvent: {
                                layout: { width },
                            },
                        }) => {
                            if (textWidth < width) {
                                setTextWidth(width);
                            }
                        }}
                    >
                        <Text
                            style={[
                                TextSize.normalSize,
                                membership[kind].count <= 0
                                    ? { textDecorationLine: "line-through" }
                                    : undefined,
                            ]}
                        >
                            {classNames[kind] !== undefined ? classNames[kind].ko : "Error"}:{" "}
                        </Text>
                    </View>
                    <Text
                        style={[
                            TextSize.normalSize,
                            membership[kind].count <= 0
                                ? { textDecorationLine: "line-through" }
                                : undefined,
                        ]}
                    >
                        {membership[kind].count < 0 ? 0 : membership[kind].count}회 남음(트레이너{" "}
                        {membership[kind].trainer})
                    </Text>
                </View>
            );
        } else {
            return (
                <View
                    key={key}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 1,
                    }}
                >
                    <MaterialCommunityIcons
                        name="check-circle-outline"
                        size={RFPercentage(2)}
                        color="black"
                        style={{ marginRight: 3 }}
                    />
                    <View
                        style={[
                            { alignItems: "flex-end" },
                            textWidth !== 0 ? { width: textWidth } : undefined,
                        ]}
                        onLayout={({
                            nativeEvent: {
                                layout: { width },
                            },
                        }) => {
                            if (textWidth < width) {
                                setTextWidth(width);
                            }
                        }}
                    >
                        <Text
                            style={[
                                TextSize.normalSize,
                                membership[kind].end !== undefined
                                    ? membership[kind].end.toDate() < today
                                        ? { textDecorationLine: "line-through" }
                                        : undefined
                                    : undefined,
                            ]}
                        >
                            {classNames[kind] !== undefined ? classNames[kind].ko : "Error"}:{" "}
                        </Text>
                    </View>
                    <Text
                        style={[
                            TextSize.normalSize,
                            membership[kind].end !== undefined
                                ? membership[kind].end.toDate() < today
                                    ? { textDecorationLine: "line-through" }
                                    : undefined
                                : undefined,
                        ]}
                    >
                        {membership[kind].start === undefined || membership[kind].end === undefined
                            ? "시작일 설정 필요"
                            : moment(membership[kind].start.toDate()).format("YY. MM. DD.") +
                              " ~ " +
                              moment(membership[kind].end.toDate()).format("YY. MM. DD.") +
                              " "}
                        ({membership[kind].month}개월권)
                    </Text>
                </View>
            );
        }
    };

    useEffect(() => {
        getter();
    }, [change]);

    const onConfirm = async (extendInfo) => {
        const confirmDate = new Date();
        const { extendDate, extendMembership } = extendInfo;
        const promises = extendMembership.map(async (memName) => {
            const changeEnd = moment(membership[memName].end.toDate())
                .add(extendDate, "days")
                .toDate();
            await db
                .collection("users")
                .doc(user.uid)
                .collection("memberships")
                .doc("list")
                .collection(memName)
                .orderBy("payDay", "desc")
                .limit(1)
                .get()
                .then((docs) => {
                    docs.forEach((doc) => {
                        if (doc.data().extended === undefined) {
                            doc.ref.set({ end: changeEnd, extended: 1 }, { merge: true });
                        } else if (doc.data().month === 12 && doc.data().extended === 1) {
                            doc.ref.set({ end: changeEnd, extended: 2 }, { merge: true });
                        }
                    });
                });
        });
        await db
            .collection("users")
            .doc(user.uid)
            .collection("extends")
            .doc(extendInfo.id)
            .set({ confirm: true, confirmDate: confirmDate }, { merge: true });
        await Promise.all(promises);
        await pushNotificationsToPerson(
            "관리자",
            user.uid,
            "연장 신청 승인 완료",
            "이용권 연장 신청 승인되었습니다.",
            { navigation: "Profile" }
        );
        setChange(!change);
        Alert.alert("성공", "연장 승인 됨", [{ text: "확인" }], { cancelable: false });
    };

    const onCancel = async (extendInfo) => {
        await db
            .collection("users")
            .doc(user.uid)
            .collection("extends")
            .doc(extendInfo.id)
            .delete();
        await pushNotificationsToPerson(
            "관리자",
            user.uid,
            "연장 신청 승인 취소",
            "이용권 연장 신청 취소되었습니다."
        );
        setChange(!change);
        Alert.alert("성공", "연장 취소 됨", [{ text: "확인" }], { cancelable: false });
    };

    return (
        <View style={{ flex: 1, alignItems: "center" }}>
            {isLoading ? (
                <View
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ActivityIndicator animating={true} size="large" color="black" />
                </View>
            ) : (
                <Surface
                    style={{
                        padding: 15,
                        width: wp("95%"),
                        flex: 1,
                        marginVertical: 10,
                        elevation: 6,
                        borderRadius: 15,
                    }}
                >
                    <ScrollView>
                        <View style={{ marginBottom: 10 }}>
                            <Text style={TextSize.normalSize}>이름 : {user.name}</Text>
                            <Text style={TextSize.normalSize}>성별 : {user.sex}</Text>
                            <Text style={TextSize.normalSize}>아이디 : {user.id}</Text>
                            <Text style={TextSize.normalSize}>휴대폰번호 : {user.phoneNumber}</Text>
                            <Text style={TextSize.normalSize}>
                                생년월일 :{" "}
                                {moment(
                                    new Date(
                                        Number(user.birthday.year),
                                        Number(user.birthday.month),
                                        Number(user.birthday.day)
                                    )
                                ).format("YYYY/MM/DD") +
                                    ` (${today.getFullYear() - Number(user.birthday.year) + 1}세)`}
                            </Text>
                            <Text style={TextSize.normalSize}>주소 : {user.address}</Text>
                            <Text style={TextSize.normalSize}>
                                보관함 번호 :{" "}
                                {user.locker.exist
                                    ? `${user.locker.lockerNumber}번 (${moment(
                                          user.locker.start.toDate()
                                      ).format("YY. MM. DD.")}~${moment(
                                          user.locker.end.toDate()
                                      ).format("YY. MM. DD.")})`
                                    : "없음"}
                            </Text>
                        </View>

                        <View style={{ marginBottom: 5 }}>
                            <Text style={TextSize.largeSize}>이용권 현황</Text>
                            {membershipKinds.length === 0 ? (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginBottom: 1,
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name="close-circle-outline"
                                        size={RFPercentage(2)}
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
                                        이용권이 없습니다.
                                    </Text>
                                </View>
                            ) : (
                                membershipKinds.map((kind, index) => renderMembership(kind, index))
                            )}
                        </View>

                        <Text style={TextSize.largeSize}>이용권 연장 확인</Text>
                        {extendList.length !== 0 ? (
                            extendList.map((obj, index) => (
                                <View
                                    key={index}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginBottom: 3,
                                    }}
                                >
                                    <View style={{ flex: 3 }}>
                                        <View
                                            style={{ flexDirection: "row", alignItems: "center" }}
                                        >
                                            <MaterialCommunityIcons
                                                name="check-circle-outline"
                                                size={RFPercentage(2)}
                                                color="black"
                                            />
                                            <Text style={TextSize.normalSize}>
                                                {obj.extendDate}일 연장(
                                                {moment(obj.submitDate.toDate()).format(
                                                    "YY. MM. DD."
                                                ) + "에 신청"}
                                                )
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                paddingLeft: RFPercentage(2) + 3,
                                                flexDirection: "row",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Ionicons
                                                name="return-down-forward-sharp"
                                                size={RFPercentage(2)}
                                                color="black"
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text style={TextSize.normalSize}>
                                                사유: {obj.extendReason}
                                            </Text>
                                        </View>
                                    </View>
                                    {obj.confirm ? (
                                        <Text
                                            style={[
                                                TextSize.normalSize,
                                                {
                                                    marginRight: RFPercentage(1.3),
                                                },
                                            ]}
                                        >
                                            승인완료
                                        </Text>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                style={[
                                                    MyStyles.buttonShadow,
                                                    MyStyles.flexCenter,
                                                    {
                                                        borderRadius: 10,
                                                        height: hp("3%"),
                                                        marginRight: 5,
                                                    },
                                                ]}
                                                onPress={() =>
                                                    Alert.alert(
                                                        "경고",
                                                        "승인하시겠습니까?",
                                                        [
                                                            { text: "취소", style: "cancel" },
                                                            {
                                                                text: "확인",
                                                                onPress: () => onConfirm(obj),
                                                            },
                                                        ],
                                                        { cancelable: false }
                                                    )
                                                }
                                            >
                                                <Text style={TextSize.normalSize}>승인</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    MyStyles.buttonShadow,
                                                    MyStyles.flexCenter,
                                                    {
                                                        borderRadius: 10,
                                                        height: hp("3%"),
                                                        marginLeft: 5,
                                                    },
                                                ]}
                                                onPress={() =>
                                                    Alert.alert(
                                                        "경고",
                                                        "신청 취소하시겠습니까",
                                                        [
                                                            { text: "취소", style: "cancel" },
                                                            {
                                                                text: "확인",
                                                                onPress: () => onCancel(obj),
                                                            },
                                                        ],
                                                        { cancelable: false }
                                                    )
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        TextSize.normalSize,
                                                        {
                                                            color: "red",
                                                        },
                                                    ]}
                                                >
                                                    취소
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            ))
                        ) : (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 1,
                                }}
                            >
                                <MaterialCommunityIcons
                                    name="close-circle-outline"
                                    size={RFPercentage(2)}
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
                                    연장 신청 내역이 없습니다.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </Surface>
            )}
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
