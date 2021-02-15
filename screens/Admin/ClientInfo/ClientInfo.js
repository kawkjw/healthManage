import React, { useEffect, useState } from "react";
import { Image, SafeAreaView, Text, View, TouchableOpacity } from "react-native";
import { db } from "../../../config/MyBase";
import { MyStyles } from "../../../css/MyStyles";
import { RFPercentage } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

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
                        list.push(temp);
                    });
                    list.sort((a, b) => {
                        return a.info.name - b.info.name;
                    });

                    setClientsInfo(list);
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
        </SafeAreaView>
    );
};
