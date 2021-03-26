import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, View, FlatList, Text, TouchableOpacity, Alert, Platform } from "react-native";
import myBase, { db } from "../../config/MyBase";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { AuthContext } from "../Auth";
import { TextSize, theme } from "../../css/MyStyles";
import { Surface, Dialog, TextInput, Button, Portal } from "react-native-paper";
import moment from "moment";

export default Locker = () => {
    const [data, setData] = useState();
    const [selectedLocker, setSelectedLocker] = useState(0);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [searchVisible, setSearchVisible] = useState(false);
    const [monthVisible, setMonthVisible] = useState(false);
    const [month, setMonth] = useState("");
    const [clientUid, setClientUid] = useState("");
    const [changed, setChanged] = useState(true);
    const { signOut } = useContext(AuthContext);

    useEffect(() => {
        const checkAdmin = async () => {
            await db
                .collection("users")
                .doc(myBase.auth().currentUser.uid)
                .get()
                .then((user) => {
                    if (!user.exists) {
                        navigation.goBack();
                    } else {
                        if (user.data().permission !== 0) {
                            signOut();
                        }
                    }
                });
        };
        checkAdmin();
    }, []);

    useEffect(() => {
        const getLockers = async () => {
            const { max } = (await db.collection("lockers").doc("maxNumber").get()).data();
            let items = Array.apply(null, Array(max)).map((value, index) => {
                return {
                    id: index + 1,
                    occupied: false,
                    name: "none",
                    phoneNumber: "none",
                    uid: "none",
                };
            });
            await db
                .collection("lockers")
                .get()
                .then((lockers) => {
                    let uidList = [];
                    lockers.forEach((locker) => {
                        if (locker.id !== "maxNumber")
                            uidList.push({ uid: locker.data().uid, id: locker.id });
                    });
                    return uidList;
                })
                .then(async (list) => {
                    const promise = list.map(async (info) => {
                        const { name, phoneNumber, locker } = (
                            await db.collection("users").doc(info.uid).get()
                        ).data();
                        items[Number(info.id) - 1]["name"] = name;
                        items[Number(info.id) - 1]["phoneNumber"] = phoneNumber;
                        items[Number(info.id) - 1]["uid"] = info.uid;
                        items[Number(info.id) - 1]["occupied"] = true;
                        if (locker.exist) {
                            items[Number(info.id) - 1]["start"] = locker.start.toDate();
                            items[Number(info.id) - 1]["end"] = locker.end.toDate();
                            items[Number(info.id) - 1]["month"] = locker.month;
                        }
                    });
                    await Promise.all(promise);
                })
                .then(() => {
                    setData(items);
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

    useEffect(() => {
        if (Number(month) <= 0) {
            setMonth("");
        }
        if (Number(month) > 12) {
            setMonth("12");
        }
    }, [month]);

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
                    .update({ locker: { exist: false } });
                await doc.ref.delete();
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

    const handleMonthCancel = () => {
        setMonth("");
        setMonthVisible(false);
    };

    const searchUser = async () => {
        await db
            .collection("users")
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
                                    setClientUid(uid);
                                    setMonthVisible(true);
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

    const addLocker = async () => {
        const addDate = new Date();
        await db
            .collection("lockers")
            .where("uid", "==", clientUid)
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
                        .collection("lockers")
                        .doc(selectedLocker.toString())
                        .get()
                        .then((doc) => {
                            if (!doc.exists) {
                                db.collection("lockers").doc(selectedLocker.toString()).set({
                                    uid: clientUid,
                                });
                            }
                        })
                        .then(async () => {
                            await db
                                .collection("users")
                                .doc(clientUid)
                                .update({
                                    locker: {
                                        exist: true,
                                        month: Number(month),
                                        lockerNumber: selectedLocker,
                                        start: addDate,
                                        end: moment(addDate)
                                            .add(month, "M")
                                            .subtract(1, "d")
                                            .toDate(),
                                    },
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
                                            handleMonthCancel();
                                            setChanged(!changed);
                                        },
                                    },
                                ],
                                { cancelable: false }
                            );
                        });
                }
            })
            .catch((error) => {
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
            <Portal>
                <Dialog visible={monthVisible} dismissable={false}>
                    <Dialog.Title>사용 기간 설정</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="1 ~ 12개월"
                            mode="outlined"
                            dense={true}
                            value={month}
                            onChangeText={setMonth}
                            keyboardType="phone-pad"
                            maxLength={2}
                            right={<TextInput.Affix text="개월" />}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={handleMonthCancel}>취소</Button>
                        <Button onPress={addLocker}>확인</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
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
                                        }개월(${moment(item.start).format("YY. MM. DD.")}~${moment(
                                            item.end
                                        ).format("YY. MM. DD.")})`,
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
                                        "비어있음",
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
                            <Text
                                style={[
                                    TextSize.largeSize,
                                    {
                                        color: item.occupied ? "red" : "blue",
                                    },
                                ]}
                            >
                                {item.id}
                            </Text>
                        </TouchableOpacity>
                    </Surface>
                )}
                numColumns={7}
                keyExtractor={(item, index) => index}
                showsVerticalScrollIndicator={false}
            />
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
