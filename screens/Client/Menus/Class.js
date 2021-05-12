import React, { useContext, useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import myBase, { db } from "../../../config/MyBase";
import { DataContext } from "../../Auth";
import { Surface, Text } from "react-native-paper";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import ToHome from "../../../components/ToHome";

export default Class = ({ navigation }) => {
    const [memberships, setMemberships] = useState([]);
    const [ptTrainerInfo, setPtTrainerInfo] = useState({ name: "", uid: "" });
    const [squashPtTrainerInfo, setSquashPtTrainerInfo] = useState({ name: "", uid: "" });
    const { classNames } = useContext(DataContext);

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
                        Alert.alert(
                            "회원권이 없습니다.",
                            "예약할 수 없습니다.",
                            [
                                {
                                    text: "확인",
                                    onPress: () => {
                                        navigation.goBack();
                                    },
                                },
                            ],
                            { cancelable: false }
                        );
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
                                    let squashPtTrainer = "";
                                    docs.forEach((doc) => {
                                        if (doc.data().end !== undefined) {
                                            const end = doc.data().end.toDate();
                                            if (kind === "pt") {
                                                const { count } = doc.data();
                                                if (count > 0) {
                                                    availabeClass.push(kind);
                                                    ptTrianer = doc.data().trainer;
                                                }
                                            } else if (kind === "squashpt") {
                                                const { count } = doc.data();
                                                if (count > 0) {
                                                    availabeClass.push(kind);
                                                    squashPtTrainer = doc.data().trainer;
                                                }
                                            } else if (today < end) {
                                                availabeClass.push(kind);
                                            }
                                        }
                                    });
                                    if (ptTrianer !== "") {
                                        await db
                                            .collection("notifications")
                                            .where("trainer", "==", true)
                                            .where("name", "==", ptTrianer)
                                            .limit(1)
                                            .get()
                                            .then((docs) => {
                                                docs.forEach((doc) => {
                                                    setPtTrainerInfo({
                                                        name: ptTrianer,
                                                        uid: doc.id,
                                                    });
                                                });
                                            });
                                    }
                                    if (squashPtTrainer !== "") {
                                        await db
                                            .collection("notifications")
                                            .where("trainer", "==", true)
                                            .where("name", "==", squashPtTrainer)
                                            .limit(1)
                                            .get()
                                            .then((docs) => {
                                                docs.forEach((doc) => {
                                                    setSquashPtTrainerInfo({
                                                        name: squashPtTrainer,
                                                        uid: doc.id,
                                                    });
                                                });
                                            });
                                    }
                                });
                        });
                        await Promise.all(promises);
                        setMemberships(availabeClass);
                    }
                })
                .catch((error) => {
                    console.log("Class Menu", error);
                });
        };
        getMemberships();
    }, []);

    const goClassReservation = (classname) => {
        if (classname === "yoga" || classname === "zoomba") {
            if (memberships.indexOf("gx") === -1) {
                Alert.alert("경고", "GX 회원권이 없습니다.", [{ text: "확인" }], {
                    cancelable: false,
                });
            } else {
                navigation.navigate("SelectDate", { classname: classname });
            }
        } else if (classname === "pilates") {
            if (memberships.indexOf("pilates2") === -1 && memberships.indexOf("pilates3") === -1) {
                Alert.alert("경고", "필라테스 회원권이 없습니다.", [{ text: "확인" }], {
                    cancelable: false,
                });
            } else {
                navigation.navigate("SelectDate", {
                    classname: classname,
                    week: memberships.indexOf("pilates3") > -1 ? 3 : 2,
                });
            }
        } else if (classname === "squash") {
            if (
                memberships.indexOf("squashpt") === -1 &&
                memberships.indexOf("squashgroup") === -1
            ) {
                Alert.alert(
                    "경고",
                    "스워시 개인 또는 단체 수업권이 없습니다.",
                    [{ text: "확인" }],
                    { cancelable: false }
                );
            } else {
                navigation.navigate("SelectSquashKind", {
                    availPt: memberships.indexOf("squashpt") > -1,
                    availGroup: memberships.indexOf("squashgroup") > -1,
                    trainerName: squashPtTrainerInfo.name,
                    trainerUid: squashPtTrainerInfo.uid,
                });
            }
        } else if (memberships.indexOf(classname) === -1) {
            Alert.alert(
                "경고",
                `${
                    classNames[classname] !== undefined ? classNames[classname].ko : "Error"
                } 회원권이 없습니다.`,
                [{ text: "확인" }],
                { cancelable: false }
            );
        } else {
            if (classname === "pt") {
                if (ptTrainerInfo.name !== "" && ptTrainerInfo.uid !== "") {
                    navigation.navigate("PT", {
                        ptName: "pt",
                        trainerName: ptTrainerInfo.name,
                        trainerUid: ptTrainerInfo.uid,
                    });
                } else {
                    Alert.alert(
                        "경고",
                        "담당 트레이너 계정이 삭제되었습니다.\n관리자에게 문의해주세요.",
                        [{ text: "확인" }],
                        { cancelable: false }
                    );
                }
            } else {
                navigation.navigate("SelectDate", { classname: classname });
            }
        }
    };

    return (
        <View style={MyStyles.container}>
            <ToHome navigation={navigation} />
            <ScrollView
                style={{
                    flex: 1,
                    paddingTop: 20,
                    alignSelf: "stretch",
                }}
                contentContainerStyle={{ alignItems: "center" }}
            >
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClassReservation("pt")}
                    >
                        <Text
                            style={[
                                TextSize.largeSize,
                                memberships.indexOf("pt") === -1
                                    ? { color: "red" }
                                    : { color: "black" },
                            ]}
                        >
                            PT
                        </Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClassReservation("pilates")}
                    >
                        <Text
                            style={[
                                TextSize.largeSize,
                                memberships.indexOf("pilates2") === -1 &&
                                memberships.indexOf("pilates3") === -1
                                    ? { color: "red" }
                                    : { color: "black" },
                            ]}
                        >
                            필라테스
                        </Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClassReservation("spinning")}
                    >
                        <Text
                            style={[
                                TextSize.largeSize,
                                memberships.indexOf("spinning") === -1
                                    ? { color: "red" }
                                    : { color: "black" },
                            ]}
                        >
                            스피닝
                        </Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClassReservation("squash")}
                    >
                        <Text
                            style={[
                                TextSize.largeSize,
                                memberships.indexOf("squashpt") === -1 &&
                                memberships.indexOf("squashgroup") === -1
                                    ? { color: "red" }
                                    : { color: "black" },
                            ]}
                        >
                            스쿼시
                        </Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClassReservation("yoga")}
                    >
                        <Text
                            style={[
                                TextSize.largeSize,
                                memberships.indexOf("gx") === -1
                                    ? { color: "red" }
                                    : { color: "black" },
                            ]}
                        >
                            요가
                        </Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClassReservation("zoomba")}
                    >
                        <Text
                            style={[
                                TextSize.largeSize,
                                memberships.indexOf("gx") === -1
                                    ? { color: "red" }
                                    : { color: "black" },
                            ]}
                        >
                            줌바
                        </Text>
                    </TouchableOpacity>
                </Surface>
            </ScrollView>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
