import React, { useEffect, useState } from "react";
import { Alert, Dimensions, SafeAreaView, ScrollView, Text, TouchableOpacity } from "react-native";
import { MyStyles, TextSize } from "../../../css/MyStyles";
import myBase, { db } from "../../../config/MyBase";

export default SelectTrainer = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
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
            await getPtTrainerUid().then(async (list) => {
                const promises = list.map(async (uid) => {
                    const name = await getPtTrainerName(uid);
                    temp.push({ name: name, uid: uid });
                });
                await Promise.all(promises);
                setTrainers(temp);
            });
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
        <SafeAreaView style={MyStyles.container}>
            <ScrollView
                style={{
                    flex: 1,
                    paddingTop: 20,
                    alignSelf: "stretch",
                }}
                contentContainerStyle={{ alignItems: "center" }}
            >
                {trainers.map((trainer, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            MyStyles.phoneButton,
                            MyStyles.buttonShadow,
                            { width: widthButton, marginBottom: 20 },
                        ]}
                        onPress={() =>
                            navigation.navigate("OT", {
                                trainerName: trainer.name,
                                trainerUid: trainer.uid,
                            })
                        }
                    >
                        <Text style={TextSize.largeSize}>{trainer.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};
