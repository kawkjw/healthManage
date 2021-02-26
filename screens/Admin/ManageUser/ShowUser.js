import React, { useContext, useEffect, useState } from "react";
import { Alert, Image, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../../config/MyBase";
import moment from "moment";
import { MyStyles } from "../../../css/MyStyles";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { pushNotificationsToPerson } from "../../../config/MyExpo";
import { DataContext } from "../../Auth";

export default ShowUser = ({ route }) => {
    const { classNames } = useContext(DataContext);
    const { user } = route.params;
    const today = new Date();
    const [isLoading, setIsLoading] = useState(true);
    const [membership, setMembership] = useState({});
    const [membershipKinds, setMembershipKinds] = useState([]);
    const [locker, setLocker] = useState(0);
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
            });
    };

    const getLocker = async () => {
        await db
            .collection("lockers")
            .where("uid", "==", user.uid)
            .get()
            .then((lockers) => {
                lockers.forEach((locker) => {
                    setLocker(Number(locker.id));
                });
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
            await getExtends().then(async () => {
                await getLocker().then(() => {
                    setIsLoading(false);
                });
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
                        <Text style={{ fontSize: RFPercentage(2) }}>
                            {classNames[kind] !== undefined ? classNames[kind].ko : "Error"}:{" "}
                        </Text>
                    </View>
                    <Text style={{ fontSize: RFPercentage(2) }}>
                        {membership[kind].count}회 남음(트레이너 {membership[kind].trainer})
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
                        <Text style={{ fontSize: RFPercentage(2) }}>
                            {classNames[kind] !== undefined ? classNames[kind].ko : "Error"}:{" "}
                        </Text>
                    </View>
                    <Text style={{ fontSize: RFPercentage(2) }}>
                        {moment(membership[kind].start.toDate()).format("YY. MM. DD.") +
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
        Alert.alert("성공", "연장 승인 됨");
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
        Alert.alert("성공", "연장 취소 됨");
    };

    return (
        <SafeAreaView style={{ flex: 1, alignItems: "center" }}>
            {isLoading ? (
                <View
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Image
                        style={{ width: 50, height: 50 }}
                        source={require("../../../assets/loading.gif")}
                    />
                </View>
            ) : (
                <View
                    style={[
                        MyStyles.buttonShadow,
                        { padding: 15, width: wp("95%"), marginTop: 10 },
                    ]}
                >
                    <View style={{ marginBottom: 10 }}>
                        <Text style={{ fontSize: RFPercentage(2) }}>이름 : {user.name}</Text>
                        <Text style={{ fontSize: RFPercentage(2) }}>성별 : {user.sex}</Text>
                        <Text style={{ fontSize: RFPercentage(2) }}>이메일 : {user.email}</Text>
                        <Text style={{ fontSize: RFPercentage(2) }}>
                            휴대폰번호 : {user.phoneNumber}
                        </Text>
                        <Text style={{ fontSize: RFPercentage(2) }}>
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
                        <Text style={{ fontSize: RFPercentage(2) }}>주소 : {user.address}</Text>
                        <Text style={{ fontSize: RFPercentage(2) }}>
                            보관함 번호 : {locker === 0 ? "없음" : locker}
                        </Text>
                    </View>

                    <View style={{ marginBottom: 5 }}>
                        <Text style={{ fontSize: RFPercentage(2.3) }}>이용권 현황</Text>
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
                                    style={{
                                        fontSize: RFPercentage(2),
                                        marginLeft: 3,
                                    }}
                                >
                                    이용권이 없습니다.
                                </Text>
                            </View>
                        ) : (
                            membershipKinds.map((kind, index) => renderMembership(kind, index))
                        )}
                    </View>

                    <Text style={{ fontSize: RFPercentage(2.3) }}>이용권 연장 확인</Text>
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
                                    <View style={{ flexDirection: "row" }}>
                                        <MaterialCommunityIcons
                                            name="check-circle-outline"
                                            size={RFPercentage(2)}
                                            color="black"
                                        />
                                        <Text style={{ fontSize: RFPercentage(2) }}>
                                            {obj.extendDate}일 연장(
                                            {moment(obj.submitDate.toDate()).format("YY. MM. DD.") +
                                                "에 신청"}
                                            )
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            paddingLeft: RFPercentage(2) + 3,
                                            flexDirection: "row",
                                        }}
                                    >
                                        <Ionicons
                                            name="return-down-forward-sharp"
                                            size={RFPercentage(2)}
                                            color="black"
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={{ fontSize: RFPercentage(2) }}>
                                            사유: {obj.extendReason}
                                        </Text>
                                    </View>
                                </View>
                                {obj.confirm ? (
                                    <Text
                                        style={{
                                            fontSize: RFPercentage(2),
                                            marginRight: RFPercentage(1.3),
                                        }}
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
                                                Alert.alert("경고", "승인하시겠습니까?", [
                                                    { text: "취소", style: "cancel" },
                                                    { text: "확인", onPress: () => onConfirm(obj) },
                                                ])
                                            }
                                        >
                                            <Text style={{ fontSize: RFPercentage(2) }}>승인</Text>
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
                                                Alert.alert("경고", "신청 취소하시겠습니까", [
                                                    { text: "취소", style: "cancel" },
                                                    { text: "확인", onPress: () => onCancel(obj) },
                                                ])
                                            }
                                        >
                                            <Text
                                                style={{
                                                    fontSize: RFPercentage(2),
                                                    color: "red",
                                                }}
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
                                style={{
                                    fontSize: RFPercentage(2),
                                    marginLeft: 3,
                                }}
                            >
                                연장 신청 내역이 없습니다.
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};
