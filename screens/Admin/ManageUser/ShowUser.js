import React, { useEffect, useState } from "react";
import { Image, SafeAreaView, Text, View } from "react-native";
import { db } from "../../../config/MyBase";
import moment from "moment";
import { MyStyles } from "../../../css/MyStyles";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default ShowUser = ({ route }) => {
    const { user } = route.params;
    const [isLoading, setIsLoading] = useState(true);
    const [membership, setMembership] = useState({});
    const [membershipKinds, setMembershipKinds] = useState([]);
    const [locker, setLocker] = useState(0);

    const getMembership = async () => {
        await db
            .collection("users")
            .doc(user.uid)
            .collection("memberships")
            .orderBy("sort", "asc")
            .get()
            .then((snapshots) => {
                let kinds = [];
                let temp = {};
                snapshots.forEach((snapshot) => {
                    kinds.push(snapshot.id);
                    temp[snapshot.id] = snapshot.data();
                });
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

    const getter = async () => {
        setIsLoading(true);
        await getMembership().then(async () => {
            await getLocker().then(() => {
                setIsLoading(false);
            });
        });
    };

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
    const renderMembership = (kind, key) => {
        if (kind === "pt") {
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
                        size={RFPercentage(2.5)}
                        color="black"
                    />
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                        <Text>{enToKo(kind)}: </Text>
                    </View>
                    <Text style={{ flex: 4 }}>
                        {membership[kind].count}회 남음
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
                        size={RFPercentage(2.5)}
                        color="black"
                    />
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                        <Text>{enToKo(kind)}: </Text>
                    </View>
                    <Text style={{ flex: 4 }}>
                        {moment(membership[kind].start.toDate()).format(
                            "YYYY. MM. DD."
                        )}{" "}
                        ~{" "}
                        {moment(membership[kind].end.toDate()).format(
                            "YYYY. MM. DD."
                        )}
                        ({membership[kind].month}개월권)
                    </Text>
                </View>
            );
        }
    };

    useEffect(() => {
        getter();
    }, []);

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
                        <Text>이름 : {user.name}</Text>
                        <Text>이메일 : {user.email}</Text>
                        <Text>휴대폰번호 : {user.phoneNumber}</Text>
                        <Text>
                            보관함 번호 : {locker === 0 ? "없음" : locker}
                        </Text>
                        <Text>유저 ID : {user.uid}</Text>
                    </View>

                    <Text style={{ fontSize: RFPercentage(2.5) }}>
                        이용권 현황
                    </Text>
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
                                size={RFPercentage(2.5)}
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
                        membershipKinds.map((kind, index) =>
                            renderMembership(kind, index)
                        )
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};
