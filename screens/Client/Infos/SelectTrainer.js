import React, { useEffect, useState } from "react";
import { Alert, View, ScrollView, TouchableOpacity } from "react-native";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import myBase, { db } from "../../../config/MyBase";
import { Surface, Text } from "react-native-paper";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default SelectTrainer = ({ navigation, route }) => {
    const uid = myBase.auth().currentUser.uid;
    const [trainers, setTrainers] = useState([]);

    const getOtNum = async () => {
        let num = -1;
        await db
            .collection("users")
            .doc(uid)
            .collection("memberships")
            .doc("list")
            .collection("health")
            .get()
            .then(async (docs) => {
                if (docs.size === 1) {
                    docs.forEach((doc) => {
                        if (doc.data().start === undefined) {
                            Alert.alert("경고", "헬스 이용권 시작일 설정이 되지 않았습니다.", [
                                { text: "확인" },
                            ]);
                            num = -100;
                            return;
                        }
                        num = 2;
                        if (doc.data().otCount !== undefined) {
                            num = doc.data().otCount;
                        }
                    });
                }
            });
        return num;
    };

    const getPtTrainerUid = async () => {
        let uidList = [];
        await db
            .collection("classes")
            .doc("pt")
            .get()
            .then((doc) => {
                uidList = [...doc.data().trainerList];
            });
        return uidList;
    };

    const getPtTrainerName = async (uid) => {
        let name = "";
        await db
            .collection("notifications")
            .doc(uid)
            .get()
            .then((doc) => {
                name = doc.data().name;
            });
        return name;
    };

    const getter = async () => {
        const num = await getOtNum();
        if (num > 0) {
            let temp = [];
            navigation.setOptions({
                headerRight: () => (
                    <View style={{ margin: 10 }}>
                        <Text style={{ color: "white" }}>{num}회 남음</Text>
                    </View>
                ),
            });
            await getPtTrainerUid().then(async (list) => {
                const promises = list.map(async (uid) => {
                    const name = await getPtTrainerName(uid);
                    temp.push({ name: name, uid: uid });
                });
                await Promise.all(promises);
                setTrainers(temp);
            });
        } else if (num === -100) {
            navigation.goBack();
        } else {
            Alert.alert("경고", "남은 OT 횟수가 없습니다.", [{ text: "확인" }], {
                cancelable: false,
            });
            navigation.goBack();
        }
    };

    useEffect(() => {
        getter();
    }, []);

    return (
        <View style={MyStyles.container}>
            <ScrollView
                style={{
                    flex: 1,
                    paddingTop: 20,
                    alignSelf: "stretch",
                }}
                contentContainerStyle={{ alignItems: "center" }}
            >
                {trainers.map((trainer, index) => (
                    <Surface key={index} style={MyStyles.surface}>
                        <TouchableOpacity
                            style={MyStyles.menu}
                            onPress={() =>
                                navigation.navigate("OT", {
                                    trainerName: trainer.name,
                                    trainerUid: trainer.uid,
                                })
                            }
                        >
                            <Text style={TextSize.largeSize}>{trainer.name}</Text>
                        </TouchableOpacity>
                    </Surface>
                ))}
            </ScrollView>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
