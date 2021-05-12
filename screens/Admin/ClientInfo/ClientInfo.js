import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { db } from "../../../config/MyBase";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Text, ActivityIndicator, Surface } from "react-native-paper";

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
        <View style={MyStyles.container}>
            <View style={{ flexDirection: "row" }}>
                {koList.slice(0, 7).map((letter, index) => (
                    <Surface
                        key={index}
                        style={{
                            flex: 1,
                            elevation: 6,
                            margin: 3,
                            height: hp("3%"),
                            borderRadius: 5,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "white",
                                margin: 3,
                            }}
                            onPress={() => setLetterIndex(index)}
                        >
                            <Text style={TextSize.normalSize}>{letter}</Text>
                        </TouchableOpacity>
                    </Surface>
                ))}
            </View>
            <View style={{ flexDirection: "row" }}>
                {koList.slice(7, koList.length).map((letter, index) => (
                    <Surface
                        key={index}
                        style={{
                            flex: 1,
                            elevation: 6,
                            margin: 3,
                            height: hp("3%"),
                            borderRadius: 5,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "white",
                                margin: 3,
                            }}
                            onPress={() => setLetterIndex(index + 7)}
                        >
                            <Text style={TextSize.normalSize}>{letter}</Text>
                        </TouchableOpacity>
                    </Surface>
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
                    <ActivityIndicator animating={true} size="large" color="black" />
                </View>
            ) : (
                <ScrollView
                    style={{ alignSelf: "stretch" }}
                    contentContainerStyle={{ alignItems: "center" }}
                >
                    <View style={{ height: hp("1%") }} />
                    {clientsInfo.length === 0 ? (
                        <Text>No Client</Text>
                    ) : (
                        clientsInfo.map((client, index) => (
                            <Surface
                                key={index}
                                style={{
                                    elevation: 6,
                                    width: wp("95%"),
                                    borderRadius: 15,
                                    marginBottom: 10,
                                }}
                            >
                                <TouchableOpacity
                                    style={{ padding: 10 }}
                                    onPress={() => {
                                        navigation.navigate("ShowUser", { user: client.info });
                                    }}
                                >
                                    <View>
                                        <Text style={TextSize.normalSize}>
                                            이름 : {client.info.name}
                                        </Text>
                                        <Text style={TextSize.normalSize}>
                                            아이디 : {client.info.id}
                                        </Text>
                                        <Text style={TextSize.normalSize}>
                                            휴대폰번호 : {client.info.phoneNumber}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </Surface>
                        ))
                    )}
                </ScrollView>
            )}
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
