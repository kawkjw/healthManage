import React, { useEffect, useState } from "react";
import { Alert, Dimensions, SafeAreaView, Text, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import myBase, { db } from "../../../config/MyBase";
import { MyStyles } from "../../../css/MyStyles";

export default SelectSquashKind = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const { availPt, availGroup } = route.params;
    const [trainerList, setTrainerList] = useState([]);

    useEffect(() => {
        const getPTTrainer = async () => {
            let list = [];
            let uidList = [];
            await db
                .collection("classes")
                .doc("pt")
                .get()
                .then((snapshot) => {
                    uidList = snapshot.data().trainerList;
                });
            const promises = uidList.map(async (data) => {
                await db
                    .collection("notifications")
                    .doc(data)
                    .get()
                    .then((snapshot) => {
                        let temp = {};
                        temp["uid"] = data;
                        temp["name"] = snapshot.data().name;
                        list.push(temp);
                    });
            });
            await Promise.all(promises);
            setTrainerList(list);
        };
        //getPTTrainer();
    }, []);

    return (
        <SafeAreaView style={MyStyles.container}>
            <TouchableOpacity
                style={[
                    MyStyles.phoneButton,
                    MyStyles.buttonShadow,
                    { width: widthButton, marginBottom: 20 },
                ]}
                onPress={() => {
                    if (availPt) {
                        navigation.navigate("PT", {
                            ptName: "squash",
                            trainerName: route.params.trainerName,
                            trainerUid: route.params.trainerUid,
                        });
                    } else {
                        Alert.alert("경고", "스쿼시 개인 수업권이 없습니다.", [{ text: "확인" }]);
                    }
                }}
            >
                <Text
                    style={[
                        availPt === false ? { color: "red" } : { color: "black" },
                        { fontSize: RFPercentage(2.3) },
                    ]}
                >
                    개인 수업
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    MyStyles.phoneButton,
                    MyStyles.buttonShadow,
                    { width: widthButton, marginBottom: 20 },
                ]}
                onPress={() => {
                    if (availGroup) {
                        navigation.navigate("SelectDate", {
                            classname: "squash",
                            week: 2,
                        });
                    } else {
                        Alert.alert("경고", "스쿼시 단체 수업권이 없습니다.", [{ text: "확인" }]);
                    }
                }}
            >
                <Text
                    style={[
                        availGroup === false ? { color: "red" } : { color: "black" },
                        { fontSize: RFPercentage(2.3) },
                    ]}
                >
                    그룹 수업
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};
