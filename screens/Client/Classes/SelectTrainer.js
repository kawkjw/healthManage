import React, { useEffect, useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
} from "react-native";
import myBase, { db } from "../../../config/MyBase";
import { MyStyles } from "../../../css/MyStyles";

export default SelectTrainer = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
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
        getPTTrainer();
    }, []);

    return (
        <SafeAreaView style={MyStyles.container}>
            <ScrollView
                style={{ flex: 1, alignSelf: "stretch", paddingVertical: 10 }}
                contentContainerStyle={{ alignItems: "center" }}
                showsVerticalScrollIndicator={false}
            >
                {trainerList.map((trainer, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            MyStyles.phoneButton,
                            MyStyles.buttonShadow,
                            { width: widthButton, marginBottom: 20 },
                        ]}
                        onPress={() =>
                            navigation.navigate("PT", {
                                trainerName: trainer.name,
                                trainerUid: trainer.uid,
                            })
                        }
                    >
                        <Text>{trainer.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};
