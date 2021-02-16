import React, { useEffect, useState } from "react";
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { db } from "../../../config/MyBase";
import { MyStyles } from "../../../css/MyStyles";
import { RFPercentage } from "react-native-responsive-fontsize";

export default ClientbyMembership = ({ navigation, route }) => {
    const [clientInfos, setClientInfos] = useState([]);
    const [classifyInfos, setClassifyInfos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [letterIndex, setLetterIndex] = useState(-1);
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
    const [numByKo, setNumByKo] = useState(new Array(14).fill(0));

    const checkKo = (str) => {
        let i = 0;
        for (; i < 13; i++) {
            if (str >= koList[i] && str < koList[i + 1]) {
                break;
            }
        }
        return i;
    };

    useEffect(() => {
        const getClientInfos = async () => {
            setLoading(true);
            const membershipsGroup = db.collectionGroup("memberships");
            await membershipsGroup
                .where("name", "==", route.params.membershipName)
                .get()
                .then((snapshots) => {
                    let list = [];
                    snapshots.forEach((snapshot) => {
                        if (snapshot.id === route.params.membershipName) {
                            list.push({
                                path: snapshot.ref.parent.parent.path,
                            });
                        }
                    });
                    return list;
                })
                .then(async (list) => {
                    let temp = list;
                    let num = new Array(14).fill(0);
                    const promises = list.map(async (v, index) => {
                        await db
                            .doc(v.path)
                            .get()
                            .then((user) => {
                                temp[index]["info"] = user.data();
                                num[checkKo(user.data().name)] = 1;
                            });
                    });
                    await Promise.all(promises);
                    temp.sort((a, b) => {
                        if (a.info.name > b.info.name) return 1;
                        if (a.info.name < b.info.name) return -1;
                        return 0;
                    });
                    setClientInfos(temp);
                    setLetterIndex(0);
                    setNumByKo(num);
                    setLoading(false);
                });
        };
        if (route.params) {
            getClientInfos();
        } else {
            navigation.goBack();
        }
    }, []);

    useEffect(() => {
        if (letterIndex !== -1) {
            let list = [];
            if (letterIndex === 13) {
                clientInfos.forEach((client) => {
                    if (client.info.name >= koList[letterIndex]) {
                        list.push(client);
                    }
                });
            } else {
                clientInfos.forEach((client) => {
                    if (
                        client.info.name >= koList[letterIndex] &&
                        client.info.name < koList[letterIndex + 1]
                    ) {
                        list.push(client);
                    }
                });
            }
            setClassifyInfos(list);
        }
    }, [letterIndex]);

    return (
        <SafeAreaView style={MyStyles.container}>
            <View style={{ flexDirection: "row" }}>
                {koList.slice(0, 7).map((letter, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            {
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 1,
                                height: hp("3%"),
                                margin: 3,
                            },
                            numByKo[index] === 1
                                ? { backgroundColor: "#b3e6ff" }
                                : { backgroundColor: "white" },
                        ]}
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
                        style={[
                            {
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 1,
                                height: hp("3%"),
                                margin: 3,
                            },
                            numByKo[index + 7] === 1
                                ? { backgroundColor: "#b3e6ff" }
                                : { backgroundColor: "white" },
                        ]}
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
            ) : clientInfos.length === 0 ? (
                <Text>No Client</Text>
            ) : (
                <ScrollView
                    style={{ alignSelf: "stretch" }}
                    contentContainerStyle={{ alignItems: "center" }}
                >
                    {classifyInfos.length === 0 ? (
                        <Text>No Client</Text>
                    ) : (
                        classifyInfos.map((client, index) => (
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
