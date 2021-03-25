import React, { useEffect, useState } from "react";
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Surface } from "react-native-paper";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { db } from "../../../config/MyBase";
import { MyStyles, TextSize } from "../../../css/MyStyles";

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
            const today = new Date();
            let check = [];
            if (route.params.membershipName === "pilates") {
                check = ["pilates2", "pilates3"];
            } else if (route.params.membershipName === "squash") {
                check = ["squash", "squashpt", "squashgroup"];
            } else {
                check = [route.params.membershipName];
            }
            setLoading(true);
            const membershipsGroup = db.collectionGroup("memberships");
            await membershipsGroup
                .where("classes", "array-contains-any", check)
                .get()
                .then(async (snapshots) => {
                    let refList = [];
                    snapshots.forEach((snapshot) => {
                        refList.push(snapshot.ref);
                    });
                    let pathList = [];
                    const promises = refList.map(async (ref) => {
                        const childPromises = check.map(async (name) => {
                            await ref
                                .collection(name)
                                .where("end", ">", today)
                                .get()
                                .then((docs) => {
                                    if (docs.size > 0) {
                                        pathList.push(ref.parent.parent.path);
                                    }
                                });
                        });
                        await Promise.all(childPromises);
                    });
                    await Promise.all(promises);
                    let list = [];
                    const set = new Set(pathList);
                    [...set].forEach((path) => {
                        list.push({ path: path });
                    });
                    return list;
                })
                .then(async (list) => {
                    let temp = list.slice();
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
                    <Surface
                        key={index}
                        style={[
                            {
                                flex: 1,
                                elevation: 6,
                                margin: 3,
                                height: hp("3%"),
                                borderRadius: 5,
                            },
                            numByKo[index] === 1
                                ? { backgroundColor: "#b3e6ff" }
                                : { backgroundColor: "white" },
                        ]}
                    >
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
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
                        style={[
                            {
                                flex: 1,
                                elevation: 6,
                                margin: 3,
                                height: hp("3%"),
                                borderRadius: 5,
                            },
                            numByKo[index + 7] === 1
                                ? { backgroundColor: "#b3e6ff" }
                                : { backgroundColor: "white" },
                        ]}
                    >
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
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
            ) : clientInfos.length === 0 ? (
                <Text style={TextSize.largeSize}>비어있습니다.</Text>
            ) : (
                <ScrollView
                    style={{ alignSelf: "stretch" }}
                    contentContainerStyle={{ alignItems: "center" }}
                >
                    <View style={{ height: hp("1%") }} />
                    {classifyInfos.length === 0 ? (
                        <Text style={TextSize.largeSize}>비어있습니다.</Text>
                    ) : (
                        classifyInfos.map((client, index) => (
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
        </SafeAreaView>
    );
};
