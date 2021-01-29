import React, { useEffect, useState } from "react";
import { Image, SafeAreaView, Text, View } from "react-native";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { db } from "../../../config/MyBase";
import { MyStyles } from "../../../css/MyStyles";
import { RFPercentage } from "react-native-responsive-fontsize";
import moment from "moment";

export default ClientbyMembership = ({ navigation, route }) => {
    const [clientInfos, setClientInfos] = useState([]);
    const [loading, setLoading] = useState(true);

    const enToKo = (s) => {
        switch (s) {
            case "health":
                return "헬스";
            case "spinning":
                return "스피닝";
            case "yoga":
                return "요가";
            case "zoomba":
                return "줌바";
            case "squash":
                return "스쿼시";
            case "pilates":
                return "필라테스";
            case "pt":
                return "PT";
        }
    };

    useEffect(() => {
        const getClientInfos = async () => {
            setLoading(true);
            const membershipsGroup = db.collectionGroup("memberships");
            await membershipsGroup
                .get()
                .then((snapshots) => {
                    let list = [];
                    snapshots.forEach((snapshot) => {
                        if (snapshot.id === route.params.membershipName) {
                            list.push({
                                path: snapshot.ref.parent.parent.path,
                            });
                        } else if (
                            route.params.membershipName === "yogaZoomba"
                        ) {
                            if (
                                snapshot.id === "yoga" ||
                                snapshot.id === "zoomba"
                            ) {
                                if (
                                    list.find(
                                        (v) =>
                                            v.path ===
                                            snapshot.ref.parent.parent.path
                                    ) === undefined
                                ) {
                                    list.push({
                                        path: snapshot.ref.parent.parent.path,
                                    });
                                }
                            }
                        }
                    });
                    return list;
                })
                .then(async (list) => {
                    let temp = list;
                    const promises = list.map(async (v, index) => {
                        temp[index]["membership"] = { kinds: [] };
                        await db
                            .doc(v.path)
                            .get()
                            .then((user) => {
                                temp[index]["info"] = user.data();
                            });
                        await db
                            .collection(v.path + "/memberships")
                            .orderBy("sort", "asc")
                            .get()
                            .then((memberships) => {
                                memberships.forEach((membership) => {
                                    temp[index]["membership"]["kinds"].push(
                                        membership.id
                                    );
                                    temp[index]["membership"][
                                        membership.id
                                    ] = membership.data();
                                });
                            });
                    });
                    await Promise.all(promises);
                    temp.sort((a, b) => {
                        return a.info.name - b.info.name;
                    });
                    setClientInfos(temp);
                    setLoading(false);
                });
        };
        if (route.params) {
            getClientInfos();
        } else {
            navigation.goBack();
        }
    }, []);

    return (
        <SafeAreaView style={MyStyles.container}>
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
                clientInfos.map((client, index) => (
                    <View
                        key={index}
                        style={[
                            MyStyles.buttonShadow,
                            { padding: 10, width: wp("95%"), marginBottom: 15 },
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
                        <Text
                            style={{
                                fontSize: RFPercentage(2),
                                fontWeight: "bold",
                            }}
                        >
                            이용권 정보
                        </Text>
                        {client.membership.kinds.map((v, index) => (
                            <View
                                key={index}
                                style={{
                                    paddingLeft: 10,
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ flex: 1 }}>{enToKo(v)}</Text>
                                <Text style={{ flex: 8 }}>
                                    {" : " +
                                        (v === "pt"
                                            ? client.membership[v].count +
                                              "번 남음"
                                            : client.membership[v].month +
                                              "개월권 (" +
                                              moment(
                                                  client.membership[
                                                      v
                                                  ].end.toDate()
                                              ).format("YYYY. MM. DD.") +
                                              " 까지)")}
                                </Text>
                            </View>
                        ))}
                    </View>
                ))
            )}
        </SafeAreaView>
    );
};
