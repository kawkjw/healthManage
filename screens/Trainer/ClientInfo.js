import React, { useEffect, useState } from "react";
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Surface } from "react-native-paper";
import { priceToString } from "../../config/hooks";
import myBase, { db } from "../../config/MyBase";
import { MyStyles, TextSize } from "../../css/MyStyles";

export default ClientInfo = ({ navigation, route }) => {
    if (!route.params) {
        navigation.goBack();
    }
    const ptName = route.params.className.split(".")[0] === "pt" ? "pt" : "squashpt";
    const [clientsInfo, setClientsInfo] = useState([]);

    const getMyClients = async () => {
        await db
            .collectionGroup("memberships")
            .where("classes", "array-contains", ptName)
            .get()
            .then((docs) => {
                let clientsRef = [];
                docs.forEach((doc) => {
                    if (!doc.ref.path.includes("temporary")) {
                        clientsRef.push(doc.ref);
                    }
                });
                return clientsRef;
            })
            .then(async (refs) => {
                let infos = [];
                const ptPromises = refs.map(async (ref) => {
                    let info = {};
                    await ref
                        .collection(ptName)
                        .orderBy("payDay", "desc")
                        .limit(1)
                        .get()
                        .then((docs) => {
                            docs.forEach((doc) => {
                                if (doc.data().trainer === myBase.auth().currentUser.displayName) {
                                    info["ptInfo"] = doc.data();
                                    info["uid"] = ref.path.split("/")[1];
                                }
                            });
                        });
                    if (info.uid) infos.push(info);
                });
                await Promise.all(ptPromises);
                const clientPromises = infos.slice().map(async (info, idx) => {
                    await db
                        .collection("users")
                        .doc(info.uid)
                        .get()
                        .then((doc) => {
                            infos[idx]["userInfo"] = doc.data();
                        });
                });
                await Promise.all(clientPromises);
                infos.sort((a, b) => {
                    if (a.userInfo.name > b.userInfo.name) return 1;
                    if (a.userInfo.name < b.userInfo.name) return -1;
                    return 0;
                });
                setClientsInfo(infos);
            });
    };

    useEffect(() => {
        getMyClients();
    }, []);

    return (
        <View style={{ paddingTop: 10 }}>
            <ScrollView>
                {clientsInfo.length === 0 ? (
                    <Text>No clients</Text>
                ) : (
                    clientsInfo.map((client, idx) => (
                        <Surface style={[MyStyles.surface, { marginHorizontal: 20 }]} key={idx}>
                            <View style={{ padding: 10 }}>
                                <Text>이름 : {client.userInfo.name}</Text>
                                <View style={{ flexDirection: "row" }}>
                                    <Text>휴대폰번호 : </Text>
                                    <TouchableOpacity
                                        onPress={() =>
                                            Linking.openURL(`tel:${client.userInfo.phoneNumber}`)
                                        }
                                    >
                                        <Text
                                            style={[TextSize.normalSize, { color: "dodgerblue" }]}
                                        >
                                            {client.userInfo.phoneNumber}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text>그룹 PT : {client.ptInfo.group ? "O" : "X"}</Text>
                                <Text>남은 횟수 : {client.ptInfo.count}</Text>
                                <Text>결제 금액 : {priceToString(client.ptInfo.price)}원</Text>
                            </View>
                        </Surface>
                    ))
                )}
            </ScrollView>
        </View>
    );
};
