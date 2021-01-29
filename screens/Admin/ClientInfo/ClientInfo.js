import React, { useEffect, useState } from "react";
import { Image, SafeAreaView, Text, View } from "react-native";
import { db } from "../../../config/MyBase";
import { MyStyles } from "../../../css/MyStyles";
import { RFPercentage } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import moment from "moment";

export default ClientInfo = ({ navigation, route }) => {
    const [clientsInfo, setClientsInfo] = useState([]);
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
        const getClients = async () => {
            setLoading(true);
            await db
                .collection("users")
                .where("permission", "==", 2)
                .get()
                .then((clients) => {
                    let list = [];
                    clients.forEach((client) => {
                        let temp = {};
                        temp["info"] = client.data();
                        temp["path"] = client.ref.path;
                        list.push(temp);
                    });
                    list.sort((a, b) => {
                        return a.info.name - b.info.name;
                    });
                    return list;
                })
                .then(async (list) => {
                    let temp = list;
                    const promises = list.map(async (v, index) => {
                        temp[index]["membership"] = { kinds: [] };
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
                    setClientsInfo(temp);
                    setLoading(false);
                });
        };
        getClients();
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
            ) : (
                clientsInfo.map((client, index) => (
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
                                }}
                            >
                                <Text style={{ flex: 1 }}>{enToKo(v)}</Text>
                                <Text style={{ flex: 8 }}>
                                    {" : " +
                                        (v === "pt"
                                            ? client.membership[v].count +
                                              "번 남음"
                                            : client.membership[v].month +
                                              "개월권(" +
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
