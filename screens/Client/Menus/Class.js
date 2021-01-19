import React, { useEffect, useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import { MyStyles } from "../../../css/MyStyles";
import myBase, { db } from "../../../config/MyBase";

export default Class = ({ navigation }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const [memberships, setMemberships] = useState([]);

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
                        Alert.alert(
                            "No memberships",
                            "You can't reserve class",
                            [
                                {
                                    text: "OK",
                                    onPress: () => {
                                        navigation.goBack();
                                    },
                                },
                            ]
                        );
                    } else {
                        let availabeClass = [];
                        snapshots.forEach((snapshot) => {
                            const end = snapshot.data().end.toDate();
                            if (today < end) {
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
        if (memberships.indexOf(classname) === -1) {
            Alert.alert("Error", `You don't have ${classname} membership`, [
                { text: "OK" },
            ]);
        } else {
            if (classname === "pt") {
                navigation.navigate("PT");
            } else {
                navigation.navigate("GX", { classname: classname });
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
                    <Text>PT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClassReservation("pilates")}
                >
                    <Text>필라테스</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClassReservation("spinning")}
                >
                    <Text>스피닝</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClassReservation("squash")}
                >
                    <Text>스쿼시</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClassReservation("yoga")}
                >
                    <Text>요가</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 40 },
                    ]}
                    onPress={() => goClassReservation("zoomba")}
                >
                    <Text>줌바</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
