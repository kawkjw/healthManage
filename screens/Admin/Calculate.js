import moment from "moment";
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
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
    const [checkDate, setCheckDate] = useState(new Date());

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
                return list;
            });
    };

    const getPTClass = async (chkDate, trainerUid) => {
        return await db
            .collection("classes")
            .doc("pt")
            .collection(trainerUid)
            .doc(moment(chkDate).format("YYYY-MM"))
            .get()
            .then((classes) => {
                if (classes.exists) {
                    return [true, classes.data().hasClass, classes.ref];
                }
                return [false];
            })
            .then(async (ret) => {
                if (ret[0]) {
                    let doneClasses = [];
                    const promises = ret[1].map(async (date) => {
                        const tmpDate = new Date(
                            chkDate.getFullYear(),
                            chkDate.getMonth(),
                            Number(date)
                        );
                        const lastDate = new Date(chkDate.getFullYear(), chkDate.getMonth() + 1, 0);
                        if (tmpDate <= lastDate) {
                            await ret[2]
                                .collection(date)
                                .where("confirm", "==", true)
                                .get()
                                .then((docs) => {
                                    docs.forEach((doc) => {
                                        const { clientUid } = doc.data();
                                        const idx = doneClasses.findIndex(
                                            (doneClass) => doneClass.clientUid === clientUid
                                        );
                                        if (idx < 0) {
                                            doneClasses.push({
                                                clientUid: clientUid,
                                                classes: [doc.data()],
                                            });
                                        } else {
                                            doneClasses[idx]["classes"].push(doc.data());
                                        }
                                    });
                                });
                        }
                    });
                    await Promise.all(promises);
                    const clientPromises = doneClasses.map(async (doneClass, idx) => {
                        await db
                            .collection("users")
                            .doc(doneClass.clientUid)
                            .get()
                            .then((doc) => {
                                doneClasses[idx]["name"] = doc.data().name;
                            });
                    });
                    await Promise.all(clientPromises);
                    doneClasses.sort((a, b) => {
                        if (a.name > b.name) return 1;
                        if (a.name < b.name) return -1;
                        return 0;
                    });
                    return doneClasses;
                }
                return [];
            })
            .then((classes) => {
                let infos = [];
                let otCount = 0;
                classes.forEach((c) => {
                    let obj = {};
                    obj["name"] = c.name;
                    obj["price"] = c.classes
                        .filter((c) => c.ot === undefined)
                        .reduce((sum, currentValue) => {
                            return sum + currentValue.priceByMembership;
                        }, 0);
                    otCount = otCount + c.classes.filter((c) => c.ot !== undefined).length;
                    if (obj["price"] !== 0) infos.push(obj);
                });
                return { otCount, infos };
            });
    };

    const getClientsByTrainer = async (trainerName) => {
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
                let clients = [];
                const ptPromises = refs.map(async (ref) => {
                    let tmp = {};
                    await ref
                        .collection("pt")
                        .orderBy("payDay", "desc")
                        .limit(1)
                        .get()
                        .then(async (docs) => {
                            let name = "";
                            docs.forEach((doc) => {
                                name = doc.data().trainer;
                            });
                            if (name === trainerName) {
                                tmp["uid"] = ref.path.split("/")[1];
                                await ref.parent.parent.get().then((doc) => {
                                    tmp["name"] = doc.data().name;
                                });
                            }
                        });
                    if (tmp.uid) clients.push(tmp);
                });
                await Promise.all(ptPromises);
                clients.sort((a, b) => {
                    if (a.name > b.name) return 1;
                    if (a.name < b.name) return -1;
                    return 0;
                });
                return clients;
            });
    };

    const onRefresh = (date) => {
        setLoading(true);
        getTrainersUid()
            .then(async (list) => {
                let tmp = [];
                const test = list.map(async (v) => {
                    let obj = { trainer: v };
                    const { otCount, infos } = await getPTClass(date, v.uid);
                    obj["clients"] = await getClientsByTrainer(v.name);
                    obj["trainer"]["otDoneCount"] = otCount;
                    obj["list"] = infos;
                    tmp.push(obj);
                });
                await Promise.all(test);
                tmp.sort((a, b) => {
                    if (a.trainer.name > b.trainer.name) return 1;
                    if (a.trainer.name < b.trainer.name) return -1;
                    return 0;
                });
                setInfo(tmp);
            })
            .then(() => setLoading(false));
    };

    useEffect(() => {
        onRefresh(checkDate);
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={{ margin: 7, padding: 3 }}
                    onPress={() => {
                        const today = new Date();
                        if (checkDate.getMonth() === today.getMonth()) {
                            setCheckDate(moment(today).subtract(1, "M").toDate());
                        } else {
                            setCheckDate(today);
                        }
                    }}
                >
                    <Text style={[TextSize.largeSize, { color: "white" }]}>
                        {checkDate.getMonth() === new Date().getMonth()
                            ? "이전 달 조회"
                            : "이번 달 조회"}
                    </Text>
                </TouchableOpacity>
            ),
        });
    }, [checkDate]);

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
                                        height: hp("30%"),
                                        margin: 10,
                                    },
                                ]}
                            >
                                <View style={{ flex: 1, padding: 13 }}>
                                    <Text style={TextSize.normalSize}>
                                        {item.trainer.name + ``}
                                    </Text>

                                    <View style={{ flex: 1, paddingLeft: 10 }}>
                                        {item.list.length === 0 && (
                                            <Text style={TextSize.normalSize}>
                                                진행한 수업이 없습니다.
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
                                    <Text style={TextSize.normalSize}>현재 담당 고객</Text>
                                    <Text style={[TextSize.normalSize, { paddingLeft: 7 }]}>
                                        {item.clients.length === 0
                                            ? "담당 고객이 없습니다."
                                            : item.clients.map((client, idx) =>
                                                  idx === item.clients.length - 1
                                                      ? client.name
                                                      : client.name + ", "
                                              )}
                                    </Text>
                                    <Text style={TextSize.normalSize}>
                                        OT 수업 진행: {item.trainer.otDoneCount}번
                                    </Text>
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
                                <Text>
                                    {checkDate.getMonth() === new Date().getMonth()
                                        ? `${
                                              checkDate.getMonth() + 1
                                          }월 1일부터 오늘까지의 경우에만 표시됩니다.`
                                        : `${checkDate.getMonth() + 1}월달만 표시됩니다.`}
                                </Text>
                            </View>
                        }
                        refreshControl={
                            <RefreshControl
                                refreshing={loading}
                                onRefresh={() => onRefresh(checkDate)}
                            />
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
