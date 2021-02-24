import React, { useEffect, useState } from "react";
import { Dimensions, SafeAreaView, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { MyStyles } from "../../../css/MyStyles";
import myBase, { db } from "../../../config/MyBase";
import { RFPercentage } from "react-native-responsive-fontsize";
import { enToKo } from "../../../config/hooks";

export default Class = ({ navigation }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const [memberships, setMemberships] = useState([]);
    const [ptTrainerInfo, setPtTrainerInfo] = useState({ name: "", uid: "" });

    useEffect(() => {
        const getMemberships = async () => {
            const uid = myBase.auth().currentUser.uid;
            const today = new Date();
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
                    return kinds;
                })
                .then(async (list) => {
                    if (list.length === 0) {
                        Alert.alert("회원권이 없습니다.", "예약할 수 없습니다.", [
                            {
                                text: "확인",
                                onPress: () => {
                                    navigation.goBack();
                                },
                            },
                        ]);
                    } else {
                        let availabeClass = [];
                        const promises = list.map(async (kind) => {
                            await db
                                .collection("users")
                                .doc(uid)
                                .collection("memberships")
                                .doc("list")
                                .collection(kind)
                                .orderBy("payDay", "desc")
                                .limit(1)
                                .get()
                                .then(async (docs) => {
                                    let ptTrianer = "";
                                    docs.forEach((doc) => {
                                        if (doc.data().end !== undefined) {
                                            const end = doc.data().end.toDate();
                                            if (kind === "pt") {
                                                const { count } = doc.data();
                                                if (count > 0) {
                                                    availabeClass.push(kind);
                                                    ptTrianer = doc.data().trainer;
                                                }
                                            } else if (today < end) {
                                                availabeClass.push(kind);
                                            }
                                        }
                                    });
                                    await db
                                        .collection("notifications")
                                        .where("trainer", "==", true)
                                        .where("name", "==", ptTrianer)
                                        .limit(1)
                                        .get()
                                        .then((docs) => {
                                            docs.forEach((doc) => {
                                                setPtTrainerInfo({ name: ptTrianer, uid: doc.id });
                                            });
                                        });
                                });
                        });
                        await Promise.all(promises);
                        setMemberships(availabeClass);
                    }
                });
        };
        getMemberships();
    }, []);

    const goClassReservation = (classname) => {
        if (classname === "yoga" || classname === "zoomba") {
            if (memberships.indexOf("gx") === -1) {
                Alert.alert("경고", "GX 회원권이 없습니다.", [{ text: "확인" }]);
            } else {
                navigation.navigate("SelectDate", { classname: classname });
            }
        } else if (classname === "pilates") {
            if (memberships.indexOf("pilates2") === -1 && memberships.indexOf("pilates3") === -1) {
                Alert.alert("경고", "필라테스 회원권이 없습니다.", [{ text: "확인" }]);
            } else {
                navigation.navigate("SelectDate", {
                    classname: classname,
                    week: memberships.indexOf("pilates2") > -1 ? 2 : 3,
                });
            }
        } else if (memberships.indexOf(classname) === -1) {
            Alert.alert("경고", `${enToKo(classname)} 회원권이 없습니다.`, [{ text: "확인" }]);
        } else {
            if (classname === "pt") {
                navigation.navigate("PT", {
                    trainerName: ptTrainerInfo.name,
                    trainerUid: ptTrainerInfo.uid,
                });
            } else {
                navigation.navigate("SelectDate", { classname: classname });
            }
        }
    };

    return (
        <SafeAreaView style={MyStyles.container}>
            <ScrollView
                style={{
                    flex: 1,
                    paddingTop: 20,
                    alignSelf: "stretch",
                }}
                contentContainerStyle={{ alignItems: "center" }}
            >
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClassReservation("pt")}
                >
                    <Text
                        style={[
                            memberships.indexOf("pt") === -1
                                ? { color: "red" }
                                : { color: "black" },
                            { fontSize: RFPercentage(2.3) },
                        ]}
                    >
                        PT
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClassReservation("pilates")}
                >
                    <Text
                        style={[
                            memberships.indexOf("pilates2") === -1 &&
                            memberships.indexOf("pilates3") === -1
                                ? { color: "red" }
                                : { color: "black" },
                            { fontSize: RFPercentage(2.3) },
                        ]}
                    >
                        필라테스
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClassReservation("spinning")}
                >
                    <Text
                        style={[
                            memberships.indexOf("spinning") === -1
                                ? { color: "red" }
                                : { color: "black" },
                            { fontSize: RFPercentage(2.3) },
                        ]}
                    >
                        스피닝
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClassReservation("squash")}
                >
                    <Text
                        style={[
                            memberships.indexOf("squash") === -1
                                ? { color: "red" }
                                : { color: "black" },
                            { fontSize: RFPercentage(2.3) },
                        ]}
                    >
                        스쿼시
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClassReservation("yoga")}
                >
                    <Text
                        style={[
                            memberships.indexOf("GX") === -1
                                ? { color: "red" }
                                : { color: "black" },
                            { fontSize: RFPercentage(2.3) },
                        ]}
                    >
                        요가
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 40 },
                    ]}
                    onPress={() => goClassReservation("zoomba")}
                >
                    <Text
                        style={[
                            memberships.indexOf("GX") === -1
                                ? { color: "red" }
                                : { color: "black" },
                            { fontSize: RFPercentage(2.3) },
                        ]}
                    >
                        줌바
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
