import React, { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Surface } from "react-native-paper";
import { priceToString } from "../../config/hooks";
import myBase, { db } from "../../config/MyBase";
import { MyStyles, TextSize, theme } from "../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import moment from "moment";

export default ClientInfo = ({ navigation, route }) => {
    if (!route.params) {
        navigation.goBack();
    }
    const uid = myBase.auth().currentUser.uid;
    const ptName = route.params.className.split(".")[0] === "pt" ? "pt" : "squashpt";
    const [clientsInfo, setClientsInfo] = useState([]);
    const [loading, setLoading] = useState(true);

    const getMyClients = async () => {
        setLoading(true);
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
                    const today = new Date();
                    const checkDates = [
                        moment(today).format("YYYY-MM"),
                        moment(today).subtract(1, "M").format("YYYY-MM"),
                    ];
                    const checkPromises = checkDates.map(async (date) => {
                        await db
                            .collection("users")
                            .doc(uid)
                            .collection("classes")
                            .doc(date)
                            .get()
                            .then((doc) => {
                                let dates = [];
                                if (doc.exists) {
                                    dates = doc.data().ptDate;
                                    return dates.reverse();
                                }
                                return dates;
                            })
                            .then(async (dates) => {
                                if (dates.length == 0) {
                                    return -1;
                                } else {
                                    const classPromises = dates.map(async (d) => {
                                        await db
                                            .collection("users")
                                            .doc(uid)
                                            .collection("classes")
                                            .doc(date)
                                            .collection(d)
                                            .where("clientUid", "==", info.uid)
                                            .get()
                                            .then((docs) => {
                                                if (docs.size > 0) {
                                                    infos[idx]["lastClassDate"] = new Date(
                                                        date.split("-")[0],
                                                        Number(date.split("-")[1]) - 1,
                                                        Number(d),
                                                        0,
                                                        0
                                                    );
                                                }
                                            });
                                    });
                                    await Promise.all(classPromises);
                                }
                            });
                    });
                    await Promise.all(checkPromises);
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
        getMyClients()
            .then(() => {
                setLoading(false);
            })
            .catch((error) => Alert.alert("Error", error.message));
    }, []);

    return (
        <View style={{ flex: 1, paddingTop: 10 }}>
            {loading ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color="black" animating={true} />
                    <Text style={[TextSize.normalSize, { marginTop: 10 }]}>
                        고객이 많을수록 로딩이 깁니다.
                    </Text>
                </View>
            ) : (
                <ScrollView>
                    {clientsInfo.length === 0 ? (
                        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Text style={TextSize.largeSize}>담당 고객이 없습니다.</Text>
                        </View>
                    ) : (
                        clientsInfo.map((client, idx) => (
                            <Surface style={[MyStyles.surface, { marginHorizontal: 20 }]} key={idx}>
                                <View style={{ padding: 10 }}>
                                    <Text style={TextSize.normalSize}>
                                        이름 : {client.userInfo.name}
                                    </Text>
                                    <View style={{ flexDirection: "row" }}>
                                        <Text style={TextSize.normalSize}>휴대폰번호 : </Text>
                                        <TouchableOpacity
                                            onPress={() =>
                                                Linking.openURL(
                                                    `tel:${client.userInfo.phoneNumber}`
                                                )
                                            }
                                        >
                                            <Text
                                                style={[
                                                    TextSize.normalSize,
                                                    { color: "dodgerblue" },
                                                ]}
                                            >
                                                {client.userInfo.phoneNumber}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={TextSize.normalSize}>
                                        등록일 :{" "}
                                        {moment(client.ptInfo.start.toDate()).format(
                                            "YYYY년 M월 D일"
                                        )}
                                    </Text>
                                    <Text style={TextSize.normalSize}>
                                        마지막 수업 날짜 :{" "}
                                        {client.lastClassDate === undefined
                                            ? "2개월 이상 됨"
                                            : moment(client.lastClassDate).format(
                                                  "YYYY년 M월 D일에 수업함"
                                              )}
                                    </Text>
                                    <Text style={TextSize.normalSize}>
                                        그룹 PT : {client.ptInfo.group ? "O" : "X"}
                                    </Text>
                                    <Text style={TextSize.normalSize}>
                                        남은 횟수 : {client.ptInfo.count}
                                    </Text>
                                    <Text style={TextSize.normalSize}>
                                        결제 금액 : {priceToString(client.ptInfo.price)}원
                                    </Text>
                                </View>
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
