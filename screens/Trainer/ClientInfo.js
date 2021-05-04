import React, { useEffect, useState } from "react";
import { Alert, Linking, RefreshControl, ScrollView, TouchableOpacity, View } from "react-native";
import { Text, ActivityIndicator, Surface } from "react-native-paper";
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
                    const today = new Date();
                    await db
                        .collection("users")
                        .doc(info.uid)
                        .get()
                        .then(async (doc) => {
                            infos[idx]["userInfo"] = doc.data();
                            const count = await doc.ref
                                .collection("reservation")
                                .doc(moment(today).format("YYYY-MM"))
                                .get()
                                .then(async (reserve) => {
                                    const dates = reserve.data().date;
                                    let classCount = 0;
                                    const reservePromises = dates.map(async (date) => {
                                        await reserve.ref
                                            .collection(date)
                                            .where("className", "==", "pt")
                                            .get()
                                            .then((reserves) => {
                                                classCount = classCount + reserves.size;
                                            });
                                    });
                                    await Promise.all(reservePromises);
                                    return classCount;
                                })
                                .catch((error) => {
                                    console.log(error);
                                    return 0;
                                });
                            infos[idx]["count"] = count;
                        });
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
                                    if (doc.data().ptDate !== undefined) {
                                        dates = doc.data().ptDate;
                                        return dates.reverse();
                                    }
                                }
                                return dates;
                            })
                            .then(async (dates) => {
                                if (dates.length === 0) {
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

    const onRefresh = () => {
        getMyClients()
            .then(() => {
                setLoading(false);
            })
            .catch((error) => Alert.alert("Error", error.message));
    };

    useEffect(() => {
        onRefresh();
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
                <ScrollView
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
                >
                    {clientsInfo.length === 0 ? (
                        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Text style={TextSize.largeSize}>담당 고객이 없습니다.</Text>
                        </View>
                    ) : (
                        <>
                            <Surface
                                style={[
                                    MyStyles.surface,
                                    { marginHorizontal: 20, borderRadius: 15 },
                                ]}
                            >
                                <View style={{ padding: 10 }}>
                                    <Text style={TextSize.normalSize}>
                                        이번 달 수업료 합계 :{" "}
                                        {clientsInfo.reduce((sum, currentValue) => {
                                            return (
                                                sum +
                                                Math.floor(
                                                    currentValue.ptInfo.price /
                                                        currentValue.ptInfo.initialCount
                                                ) *
                                                    currentValue.count
                                            );
                                        }, 0)}
                                        원
                                    </Text>
                                </View>
                            </Surface>
                            {clientsInfo.map(
                                (client, idx) =>
                                    client.ptInfo.count !== 0 && (
                                        <Surface
                                            style={[MyStyles.surface, { marginHorizontal: 20 }]}
                                            key={idx}
                                        >
                                            <View style={{ padding: 10 }}>
                                                <Text style={TextSize.normalSize}>
                                                    이름 : {client.userInfo.name}
                                                </Text>
                                                <View style={{ flexDirection: "row" }}>
                                                    <Text style={TextSize.normalSize}>
                                                        휴대폰번호 :{" "}
                                                    </Text>
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
                                                    남은 횟수 :{" "}
                                                    {client.ptInfo.count +
                                                        " / " +
                                                        client.ptInfo.initialCount}
                                                </Text>
                                                <Text style={TextSize.normalSize}>
                                                    결제 금액 : {priceToString(client.ptInfo.price)}
                                                    원
                                                </Text>
                                                <Text style={TextSize.normalSize}>
                                                    횟수 당 금액 :{" "}
                                                    {priceToString(
                                                        Math.floor(
                                                            client.ptInfo.price /
                                                                client.ptInfo.initialCount
                                                        )
                                                    )}
                                                    원
                                                </Text>
                                                <Text style={TextSize.normalSize}>
                                                    이번 달 수업료 :{" "}
                                                    {priceToString(
                                                        Math.floor(
                                                            client.ptInfo.price /
                                                                client.ptInfo.initialCount
                                                        ) * client.count
                                                    )}
                                                    원
                                                </Text>
                                            </View>
                                        </Surface>
                                    )
                            )}
                        </>
                    )}
                </ScrollView>
            )}
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
