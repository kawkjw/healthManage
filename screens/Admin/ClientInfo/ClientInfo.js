import React, { useEffect, useState } from "react";
import {
    Image,
    SafeAreaView,
    Text,
    View,
    TouchableOpacity,
} from "react-native";
import { db } from "../../../config/MyBase";
import { MyStyles } from "../../../css/MyStyles";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import moment from "moment";
import Modal from "react-native-modal";

export default ClientInfo = ({ navigation, route }) => {
    const [clientsInfo, setClientsInfo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalMemberships, setModalMemberships] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

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
                    <TouchableOpacity
                        key={index}
                        onPress={() => {
                            setSelectedIndex(index);
                            setModalMemberships(true);
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
            <Modal
                isVisible={modalMemberships}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => setModalMemberships(false)}
            >
                <View
                    style={{
                        backgroundColor: "white",
                        height: hp("30%"),
                    }}
                >
                    <TouchableOpacity
                        style={{
                            width: wp("15%"),
                            alignItems: "center",
                            padding: 10,
                        }}
                        onPress={() => setModalMemberships(false)}
                    >
                        <Text style={{ fontSize: RFPercentage(2) }}>닫기</Text>
                    </TouchableOpacity>
                    <View
                        style={{
                            borderWidth: "0.5",
                            marginHorizontal: 5,
                            borderColor: "grey",
                        }}
                    />
                    <View style={{ padding: 7 }}>
                        <Text
                            style={{
                                fontSize: RFPercentage(2.5),
                                fontWeight: "bold",
                            }}
                        >
                            이용권 정보
                        </Text>
                        {selectedIndex === -1 ? (
                            <Text>Error</Text>
                        ) : (
                            clientsInfo[selectedIndex].membership.kinds.map(
                                (v, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            paddingLeft: 10,
                                            flexDirection: "row",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                flex: 1,
                                                fontSize: RFPercentage(2),
                                            }}
                                        >
                                            {enToKo(v)}
                                        </Text>
                                        <Text
                                            style={{
                                                flex: 6,
                                                fontSize: RFPercentage(2),
                                            }}
                                        >
                                            {" : " +
                                                (v === "pt"
                                                    ? clientsInfo[selectedIndex]
                                                          .membership[v].count +
                                                      "번 남음"
                                                    : clientsInfo[selectedIndex]
                                                          .membership[v].month +
                                                      "개월권 (" +
                                                      moment(
                                                          clientsInfo[
                                                              selectedIndex
                                                          ].membership[
                                                              v
                                                          ].end.toDate()
                                                      ).format(
                                                          "YYYY. MM. DD."
                                                      ) +
                                                      " 까지)")}
                                        </Text>
                                    </View>
                                )
                            )
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};
