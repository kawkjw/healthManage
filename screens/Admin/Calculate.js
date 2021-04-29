import moment from "moment";
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, ScrollView, Text, View } from "react-native";
import { ActivityIndicator, Surface } from "react-native-paper";
import { db } from "../../config/MyBase";
import { MyStyles, TextSize, theme } from "../../css/MyStyles";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
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
        return await db
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
                return infos;
            });
    };

    const getOtClassCount = async (uid) => {
        return await db
            .collection("classes")
            .doc("pt")
            .collection(uid)
            .doc(moment().format("YYYY-MM"))
            .get()
            .then(async (doc) => {
                const hasClass = doc.data().hasClass;
                let count = 0;
                const promises = hasClass.map(async (date) => {
                    await doc.ref
                        .collection(date)
                        .where("ot", "==", true)
                        .get()
                        .then((docs) => {
                            count = count + docs.size;
                        });
                });
                await Promise.all(promises);
                return count;
            });
    };

    const onRefresh = () => {
        setLoading(true);
        getTrainersUid()
            .then(async (list) => {
                let infos = await getClientsByTrainer(list);
                const promsies = infos.map(async (v, i) => {
                    infos[i]["trainer"]["otDoneCount"] = await getOtClassCount(v.trainer.uid);
                });
                await Promise.all(promsies);
                setInfo(infos);
            })
            .then(() => setLoading(false));
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
                    <FlatList
                        data={info}
                        windowSize={1}
                        renderItem={({ item }) => (
                            <Surface
                                style={[
                                    MyStyles.surface,
                                    {
                                        marginBottom: 10,
                                        width: wp("45%"),
                                        height: hp("25%"),
                                        margin: 10,
                                    },
                                ]}
                            >
                                <View style={{ padding: 13 }}>
                                    <Text style={TextSize.normalSize}>
                                        {item.trainer.name +
                                            `(OT 수업 진행: ${item.trainer.otDoneCount}번)`}
                                    </Text>
                                    <View style={{ paddingLeft: 15 }}>
                                        {item.list.length === 0 && (
                                            <Text style={TextSize.normalSize}>
                                                담당 고객이 없습니다.
                                            </Text>
                                        )}
                                        {item.list.map((client, i) => (
                                            <View key={i}>
                                                <Text style={TextSize.normalSize}>
                                                    {client.name} : {priceToString(client.price)}원
                                                </Text>
                                            </View>
                                        ))}
                                        {item.list.length !== 0 && (
                                            <Text style={TextSize.normalSize}>
                                                합계 :{" "}
                                                {priceToString(
                                                    item.list.reduce((sum, value) => {
                                                        return sum + value.price;
                                                    }, 0)
                                                )}
                                                원
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </Surface>
                        )}
                        numColumns={2}
                        keyExtractor={(item, index) => index}
                        ListHeaderComponent={
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
                        }
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
                        }
                    />
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
