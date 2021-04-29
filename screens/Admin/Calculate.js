import moment from "moment";
import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { ActivityIndicator, Surface } from "react-native-paper";
import { db } from "../../config/MyBase";
import { MyStyles, theme } from "../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { priceToString } from "../../config/hooks";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";

export default Calculate = ({ navigation, route }) => {
    const [info, setInfo] = useState(undefined);
    const [loading, setLoading] = useState(true);

    const getTrainersUid = async () => {
        return await db
            .collection("classes")
            .doc("pt")
            .get()
            .then(async (doc) => {
                let uids = [];
                if (doc.data().trainerList !== undefined) {
                    uids = doc.data().trainerList;
                }
                let list = [];
                const promises = uids.map(async (uid) => {
                    await db
                        .collection("users")
                        .doc(uid)
                        .get()
                        .then((user) => {
                            list.push({ uid: uid, name: user.data().name });
                        });
                });
                await Promise.all(promises);
                list.sort((a, b) => {
                    if (a.name > b.name) return 1;
                    if (a.name < b.name) return -1;
                    return 0;
                });
                return list;
            });
    };

    const getClientsByTrainer = async (trainerList) => {
        let tmp = new Array(trainerList.length).fill({}).map((v) => ({ clients: [] }));
        await db
            .collectionGroup("memberships")
            .where("classes", "array-contains", "pt")
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
                const ptPromises = refs.map(async (ref) => {
                    let info = {};
                    await ref
                        .collection("pt")
                        .orderBy("payDay", "desc")
                        .limit(1)
                        .get()
                        .then((docs) => {
                            docs.forEach((doc) => {
                                const idx = trainerList.findIndex(
                                    (elem) => elem.name === doc.data().trainer
                                );
                                if (idx !== -1) {
                                    info["ptInfo"] = doc.data();
                                    info["uid"] = ref.path.split("/")[1];
                                }

                                if (info.uid) tmp[idx]["clients"].push(info);
                            });
                        });
                });
                await Promise.all(ptPromises);
                const trainerPromises = tmp.map(async (trainer, idx) => {
                    const clientPromises = trainer.clients.map(async (client, i) => {
                        const today = new Date();
                        await db
                            .collection("users")
                            .doc(client.uid)
                            .get()
                            .then(async (doc) => {
                                tmp[idx]["clients"][i]["userInfo"] = doc.data();
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
                                tmp[idx]["clients"][i]["count"] = count;
                            });
                    });
                    await Promise.all(clientPromises);
                    tmp[idx]["clients"].sort((a, b) => {
                        if (a.userInfo.name > b.userInfo.name) return 1;
                        if (a.userInfo.name < b.userInfo.name) return -1;
                        return 0;
                    });
                });
                await Promise.all(trainerPromises);
            })
            .then(() => {
                let infos = new Array(trainerList.length)
                    .fill({})
                    .map((v, i) => ({ trainer: trainerList[i], list: [] }));
                tmp.forEach((obj, idx) => {
                    const clients = obj.clients;
                    clients.forEach((client) => {
                        let result = {};
                        result["name"] = client.userInfo.name;
                        result["price"] =
                            Math.floor(client.ptInfo.price / client.ptInfo.initialCount) *
                            client.count;
                        infos[idx]["list"].push(result);
                    });
                });
                setInfo(infos);
            });
    };

    const onRefresh = () => {
        setLoading(true);
        getTrainersUid().then(async (list) => {
            await getClientsByTrainer(list).then(() => setLoading(false));
        });
    };

    useEffect(() => {
        onRefresh();
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1, paddingTop: 10 }}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: "center" }}>
                        <ActivityIndicator size="large" color="black" />
                    </View>
                ) : info !== undefined ? (
                    <>
                        <ScrollView
                            refreshControl={
                                <RefreshControl refreshing={loading} onRefresh={onRefresh} />
                            }
                        >
                            {info.map((elem, idx) => (
                                <Surface
                                    key={idx}
                                    style={[MyStyles.surface, { marginHorizontal: 10 }]}
                                >
                                    <View style={{ padding: 15 }}>
                                        <Text>{elem.trainer.name}</Text>
                                        <View style={{ paddingLeft: 15 }}>
                                            {elem.list.length === 0 && (
                                                <Text>담당 고객이 없습니다.</Text>
                                            )}
                                            {elem.list.map((client, i) => (
                                                <View key={i}>
                                                    <Text>
                                                        {client.name} :{" "}
                                                        {priceToString(client.price)}원
                                                    </Text>
                                                </View>
                                            ))}
                                            {elem.list.length !== 0 && (
                                                <Text>
                                                    합계 :{" "}
                                                    {priceToString(
                                                        elem.list.reduce((sum, value) => {
                                                            return sum + value.price;
                                                        }, 0)
                                                    )}
                                                    원
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </Surface>
                            ))}
                            <View
                                style={{
                                    alignItems: "center",
                                    flexDirection: "row",
                                    paddingLeft: 10,
                                }}
                            >
                                <MaterialCommunityIcons
                                    name="alert-circle-outline"
                                    size={RFPercentage(2.4)}
                                    color="black"
                                    style={{ marginRight: 7 }}
                                />
                                <Text>이번 달의 경우에만 표시됩니다.</Text>
                            </View>
                        </ScrollView>
                    </>
                ) : (
                    <Text>Error</Text>
                )}
            </View>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
