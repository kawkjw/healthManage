import React, { useEffect, useState } from "react";
import { Image, SafeAreaView, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { db } from "../../../config/MyBase";
import { MyStyles } from "../../../css/MyStyles";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";

export default ClientInfo = ({ navigation, route }) => {
    const [clientsInfo, setClientsInfo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [letterIndex, setLetterIndex] = useState(0);
    const koList = [
        "가",
        "나",
        "다",
        "라",
        "마",
        "바",
        "사",
        "아",
        "자",
        "차",
        "카",
        "타",
        "파",
        "하",
    ];

    useEffect(() => {
        const getClients = async () => {
            setLoading(true);
            if (letterIndex === 13) {
                await db
                    .collection("users")
                    .where("permission", "==", 2)
                    .where("name", ">=", koList[letterIndex])
                    .get()
                    .then((clients) => {
                        let list = [];
                        clients.forEach((client) => {
                            let temp = {};
                            temp["info"] = client.data();
                            list.push(temp);
                        });
                        setClientsInfo(list);
                    });
            } else {
                await db
                    .collection("users")
                    .where("permission", "==", 2)
                    .where("name", ">=", koList[letterIndex])
                    .where("name", "<", koList[letterIndex + 1])
                    .get()
                    .then((clients) => {
                        let list = [];
                        clients.forEach((client) => {
                            let temp = {};
                            temp["info"] = client.data();
                            list.push(temp);
                        });
                        setClientsInfo(list);
                    });
            }
            setLoading(false);
        };
        getClients();
    }, [letterIndex]);

    return (
        <SafeAreaView style={MyStyles.container}>
            <View style={{ flexDirection: "row" }}>
                {koList.slice(0, 7).map((letter, index) => (
                    <TouchableOpacity
                        key={index}
                        style={{
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            backgroundColor: "white",
                            height: hp("3%"),
                            margin: 3,
                        }}
                        onPress={() => setLetterIndex(index)}
                    >
                        <Text style={{ fontSize: RFPercentage(2) }}>{letter}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={{ flexDirection: "row" }}>
                {koList.slice(7, koList.length).map((letter, index) => (
                    <TouchableOpacity
                        key={index}
                        style={{
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            backgroundColor: "white",
                            height: hp("3%"),
                            margin: 3,
                        }}
                        onPress={() => setLetterIndex(index + 7)}
                    >
                        <Text style={{ fontSize: RFPercentage(2) }}>{letter}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {loading ? (
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
                <ScrollView
                    style={{ alignSelf: "stretch" }}
                    contentContainerStyle={{ alignItems: "center" }}
                >
                    {clientsInfo.length === 0 ? (
                        <Text>No Client</Text>
                    ) : (
                        clientsInfo.map((client, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    navigation.navigate("ShowUser", { user: client.info });
                                }}
                            >
                                <View
                                    style={[
                                        MyStyles.buttonShadow,
                                        {
                                            padding: 10,
                                            width: wp("95%"),
                                            marginBottom: 15,
                                        },
                                        index === 0 ? { marginTop: 10 } : undefined,
                                    ]}
                                >
                                    <Text style={{ fontSize: RFPercentage(2) }}>
                                        이름 : {client.info.name}
                                    </Text>
                                    <Text style={{ fontSize: RFPercentage(2) }}>
                                        이메일 : {client.info.email}
                                    </Text>
                                    <Text style={{ fontSize: RFPercentage(2) }}>
                                        휴대폰번호 : {client.info.phoneNumber}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};
