import React, { useEffect, useState } from "react";
import { Dimensions, SafeAreaView, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { MyStyles } from "../../../css/MyStyles";
import myBase, { db } from "../../../config/MyBase";
import { RFPercentage } from "react-native-responsive-fontsize";

export default Class = ({ navigation }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const [memberships, setMemberships] = useState([]);

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

    useEffect(() => {
        const getMemberships = async () => {
            const uid = myBase.auth().currentUser.uid;
            const today = new Date();
            await db
                .collection("users")
                .doc(uid)
                .collection("memberships")
                .get()
                .then((snapshots) => {
                    if (snapshots.size === 0) {
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
                        snapshots.forEach((snapshot) => {
                            const end = snapshot.data().end.toDate();
                            if (snapshot.id === "pt") {
                                const { count } = snapshot.data();
                                if (count > 0) {
                                    availabeClass.push(snapshot.id);
                                }
                            } else if (today < end) {
                                availabeClass.push(snapshot.id);
                            }
                        });
                        setMemberships(availabeClass);
                    }
                });
        };
        getMemberships();
    }, []);

    const goClassReservation = (classname) => {
        if (classname === "yoga" || classname === "zoomba") {
            if (memberships.indexOf("GX") === -1) {
                Alert.alert("경고", "GX 회원권이 없습니다.", [{ text: "확인" }]);
            } else {
                navigation.navigate("SelectDate", { classname: classname });
            }
        } else if (memberships.indexOf(classname) === -1) {
            Alert.alert("경고", `${enToKo(classname)} 회원권이 없습니다.`, [{ text: "확인" }]);
        } else {
            if (classname === "pt") {
                navigation.navigate("SelectTrainer");
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
                            memberships.indexOf("pilates") === -1
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
