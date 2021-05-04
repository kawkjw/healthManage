import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList, TouchableOpacity, Alert } from "react-native";
import { db, fieldDelete } from "../../config/MyBase";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { TextSize, theme } from "../../css/MyStyles";
import {
    Surface,
    Dialog,
    TextInput,
    Button,
    Portal,
    ActivityIndicator,
    Badge,
    Text,
} from "react-native-paper";
import moment from "moment";

export default Locker = () => {
    const [data, setData] = useState();
    const [selectedLocker, setSelectedLocker] = useState(0);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [searchVisible, setSearchVisible] = useState(false);
    const [changed, setChanged] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getLockers = async () => {
            setLoading(true);
            const today = new Date();
            const { max } = (await db.collection("lockers").doc("maxNumber").get()).data();
            let items = Array.apply(null, Array(max)).map((value, index) => {
                return {
                    id: index + 1,
                    occupied: false,
                    name: "none",
                    phoneNumber: "none",
                    uid: "none",
                    color: "grey",
                    pw: "-1",
                };
            });
            await db
                .collection("lockers")
                .orderBy("number", "asc")
                .limit(max)
                .get()
                .then((lockers) => {
                    let uidList = [];
                    lockers.forEach((locker) => {
                        if (locker.id !== "maxNumber") {
                            if (locker.data().pw !== undefined) {
                                items[Number(locker.id) - 1]["pw"] = locker.data().pw;
                            }
                            if (locker.data().uid !== undefined) {
                                uidList.push({ uid: locker.data().uid, id: locker.id });
                            }
                        }
                    });
                    return uidList;
                })
                .then(async (list) => {
                    const promise = list.map(async (info) => {
                        const { name, phoneNumber } = (
                            await db.collection("users").doc(info.uid).get()
                        ).data();
                        let locker = undefined;
                        await db
                            .collection("users")
                            .doc(info.uid)
                            .collection("locker")
                            .orderBy("payDay", "desc")
                            .limit(1)
                            .get()
                            .then((docs) => {
                                docs.forEach((doc) => {
                                    locker = doc.data();
                                });
                            });
                        items[Number(info.id) - 1]["name"] = name;
                        items[Number(info.id) - 1]["phoneNumber"] = phoneNumber;
                        items[Number(info.id) - 1]["uid"] = info.uid;
                        items[Number(info.id) - 1]["occupied"] = true;
                        if (locker !== undefined) {
                            items[Number(info.id) - 1]["color"] =
                                locker.end.toDate() < today ? "red" : "blue";
                            items[Number(info.id) - 1]["start"] = locker.start.toDate();
                            items[Number(info.id) - 1]["end"] = locker.end.toDate();
                            items[Number(info.id) - 1]["month"] = locker.month;
                        }
                    });
                    await Promise.all(promise);
                })
                .then(() => {
                    setData(items);
                    setLoading(false);
                });
        };
        getLockers();
    }, [changed]);

    useEffect(() => {
        setPhoneNumber(
            phoneNumber
                .replace(/[^0-9]/g, "")
                .replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3")
                .replace("--", "-")
        );
    }, [phoneNumber]);

    const removeLocker = async (id) => {
        await db
            .collection("lockers")
            .doc(id.toString())
            .get()
            .then(async (doc) => {
                const { uid } = doc.data();
                await db
                    .collection("users")
                    .doc(uid)
                    .collection("locker")
                    .orderBy("payDay", "desc")
                    .get()
                    .then(async (docs) => {
                        let ref = undefined;
                        docs.forEach((doc) => {
                            ref = doc.ref;
                        });
                        await ref.update({ lockerNumber: 0 });
                    });
                await doc.ref.update({ uid: fieldDelete() });
            })
            .then(() => {
                Alert.alert("성공", "성공적으로 제거되었습니다.", [{ text: "확인" }], {
                    cancelable: false,
                });
            })
            .catch((error) => {
                Alert.alert("실패", "이미 제거되었습니다.", [{ text: "확인" }], {
                    cancelable: false,
                });
            });
        setChanged(!changed);
    };

    const handleSearchCancel = () => {
        setPhoneNumber("");
        setSearchVisible(false);
    };

    const searchUser = async () => {
        await db
            .collection("users")
            .where("permission", "==", 2)
            .where("phoneNumber", "==", phoneNumber)
            .get()
            .then((snapshots) => {
                if (snapshots.empty) {
                    throw Error("찾는 고객이 없습니다.");
                } else if (snapshots.size > 1) {
                    throw Error("같은 휴대폰번호가 많습니다.");
                }
                snapshots.forEach(async (snapshot) => {
                    const { name, uid } = snapshot.data();
                    const phone = snapshot.data().phoneNumber;
                    Alert.alert(
                        "정보",
                        `이름: ${name}\n휴대폰번호: ${phone}\n위 정보가 맞습니까?`,
                        [
                            {
                                text: "확인",
                                onPress: () => {
                                    handleSearchCancel();
                                    addLocker(uid);
                                },
                            },
                            { text: "취소" },
                        ],
                        { cancelable: false }
                    );
                });
            })
            .catch((error) => {
                Alert.alert("실패", error.message, [{ text: "확인" }], { cancelable: false });
            });
    };

    const addLocker = async (uid) => {
        const addDate = new Date();
        await db
            .collection("lockers")
            .where("uid", "==", uid)
            .get()
            .then(async (lockers) => {
                if (lockers.size > 0) {
                    let lockerNum;
                    lockers.forEach((locker) => {
                        lockerNum = locker.id;
                    });
                    throw Error(`이미 보관함을 가지고 있음: ${lockerNum}`);
                } else {
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("locker")
                        .where("lockerNumber", "==", 0)
                        .orderBy("payDay", "desc")
                        .limit(1)
                        .get()
                        .then(async (docs) => {
                            if (docs.size === 1) {
                                let data;
                                docs.forEach((doc) => {
                                    data = { ...doc.data(), id: doc.id };
                                });

                                await db
                                    .collection("lockers")
                                    .doc(selectedLocker.toString())
                                    .get()
                                    .then((doc) => {
                                        if (doc.data().uid === undefined) {
                                            db.collection("lockers")
                                                .doc(selectedLocker.toString())
                                                .set(
                                                    {
                                                        uid: uid,
                                                    },
                                                    { merge: true }
                                                );
                                        } else {
                                            throw Error("이미 배정된 보관함입니다.");
                                        }
                                    })
                                    .then(async () => {
                                        await db
                                            .collection("users")
                                            .doc(uid)
                                            .collection("locker")
                                            .doc(data.id)
                                            .get()
                                            .then(async (doc) => {
                                                const check = new Date("9999-12-01");
                                                let change = { lockerNumber: selectedLocker };
                                                if (doc.data().end.toDate() > check) {
                                                    change["start"] = addDate;
                                                    change["end"] = moment(addDate)
                                                        .add(data.month, "M")
                                                        .subtract(1, "d")
                                                        .toDate();
                                                } else if (doc.data().end.toDate() < addDate) {
                                                    throw Error("이미 만료된 결제정보입니다.");
                                                }
                                                return change;
                                            })
                                            .then(async (change) => {
                                                await db
                                                    .collection("users")
                                                    .doc(uid)
                                                    .collection("locker")
                                                    .doc(data.id)
                                                    .update(change);
                                            });
                                    })
                                    .then(() => {
                                        Alert.alert(
                                            "성공",
                                            "성공적으로 추가되었습니다.",
                                            [
                                                {
                                                    text: "확인",
                                                    onPress: () => {
                                                        setChanged(!changed);
                                                    },
                                                },
                                            ],
                                            { cancelable: false }
                                        );
                                    });
                            } else {
                                Alert.alert(
                                    "경고",
                                    "관리자 웹페이지에서 결제정보를 먼저 입력해주세요.",
                                    [{ text: "확인" }],
                                    { cancelable: false }
                                );
                            }
                        });
                }
            })
            .catch((error) => {
                console.log(error);
                Alert.alert("실패", error.message, [{ text: "확인" }], {
                    cancelable: false,
                });
            });
    };

    return (
        <View style={styles.container}>
            <Portal>
                <Dialog visible={searchVisible} dismissable={false}>
                    <Dialog.Title>휴대폰 번호 입력</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="휴대폰 번호"
                            mode="outlined"
                            dense={true}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            maxLength={13}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={handleSearchCancel}>취소</Button>
                        <Button onPress={searchUser}>확인</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            {loading ? (
                <View style={{ flex: 1, justifyContent: "center" }}>
                    <ActivityIndicator size="large" color="black" animating={true} />
                </View>
            ) : (
                <FlatList
                    data={data}
                    renderItem={({ item }) => (
                        <Surface
                            style={{
                                flexDirection: "column",
                                margin: 5,
                                elevation: 4,
                                borderRadius: 10,
                            }}
                        >
                            <TouchableOpacity
                                style={styles.locker}
                                onPress={() => {
                                    if (item.occupied) {
                                        Alert.alert(
                                            item.id.toString() + "번",
                                            `${item.name}\n${item.phoneNumber}\n${
                                                item.month
                                            }개월(${moment(item.start).format(
                                                "YY. MM. DD."
                                            )}~${moment(item.end).format(
                                                "YY. MM. DD."
                                            )})\n비밀번호 : ${
                                                item.pw === "-1" ? "설정 필요" : item.pw
                                            }`,
                                            [
                                                {
                                                    text: "삭제",
                                                    onPress: () => {
                                                        Alert.alert(
                                                            "확실합니까?",
                                                            "",
                                                            [
                                                                { text: "취소" },
                                                                {
                                                                    text: "삭제",
                                                                    onPress: () => {
                                                                        removeLocker(item.id);
                                                                    },
                                                                    style: "destructive",
                                                                },
                                                            ],
                                                            { cancelable: false }
                                                        );
                                                    },
                                                    style: "destructive",
                                                },
                                                { text: "확인" },
                                            ],
                                            { cancelable: false }
                                        );
                                    } else {
                                        Alert.alert(
                                            item.id.toString() + "번",
                                            `비어있음\n비밀번호 : ${
                                                item.pw === "-1" ? "설정 필요" : item.pw
                                            }`,
                                            [
                                                {
                                                    text: "추가",
                                                    onPress: () => {
                                                        setSelectedLocker(item.id);
                                                        setSearchVisible(true);
                                                    },
                                                },
                                                { text: "확인" },
                                            ],
                                            { cancelable: false }
                                        );
                                    }
                                }}
                            >
                                {item.pw === "-1" && (
                                    <Badge
                                        visible={true}
                                        size={10}
                                        style={{
                                            position: "absolute",
                                            top: 5,
                                            right: 5,
                                        }}
                                    />
                                )}
                                <Text style={[TextSize.largeSize, { color: item.color }]}>
                                    {item.id}
                                </Text>
                            </TouchableOpacity>
                        </Surface>
                    )}
                    numColumns={7}
                    keyExtractor={(item, index) => index}
                    showsVerticalScrollIndicator={false}
                />
            )}
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    locker: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: wp("11.8%"),
        height: wp("14%"),
        backgroundColor: "white",
        borderRadius: 10,
    },
});
