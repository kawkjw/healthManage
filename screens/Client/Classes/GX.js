import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { MyStyles, TextSize } from "../../../css/MyStyles";
import myBase, { arrayUnion, db } from "../../../config/MyBase";
import moment from "moment";
import { getHoliday } from "../../../config/hooks";
import Modal from "react-native-modal";
import { ActivityIndicator, Button, Colors, Surface } from "react-native-paper";
import * as Notifications from "expo-notifications";

export default GX = ({ navigation, route }) => {
    const uid = myBase.auth().currentUser.uid;
    const { classname, date } = route.params;
    const today = new Date();
    const [data, setData] = useState([]);
    const [modalClass, setModalClass] = useState(false);
    const [selectDate, setSelectDate] = useState(0);
    const [classList, setClassList] = useState([]);
    const [availReserve, setAvailReserve] = useState(false);
    const [cloading, setCloading] = useState(true);

    useEffect(() => {
        const showCalendar = async () => {
            setCloading(true);
            let items = [
                { id: "일", color: "red", pressable: false, isHeader: true },
                { id: "월", color: "black", pressable: false, isHeader: true },
                { id: "화", color: "black", pressable: false, isHeader: true },
                { id: "수", color: "black", pressable: false, isHeader: true },
                { id: "목", color: "black", pressable: false, isHeader: true },
                { id: "금", color: "black", pressable: false, isHeader: true },
                { id: "토", color: "blue", pressable: false, isHeader: true },
            ];
            const firstDate = new Date(date + "-01");
            for (let i = 0; i < firstDate.getDay(); i++) {
                items.push({ id: " ", pressable: false, isHeader: true });
            }
            let classDate = [];
            await db
                .collection("classes")
                .doc(classname)
                .collection("class")
                .doc(date)
                .get()
                .then((snapshot) => {
                    if (snapshot.exists) {
                        classDate = snapshot.data().class;
                    }
                });
            classDate.sort();
            classDate.push("-1");
            let index = 0;
            const endDate = new Date(date.split("-")[0], date.split("-")[1], 0);
            const holidayList = await getHoliday(
                Number(date.split("-")[0]),
                Number(date.split("-")[1])
            );
            for (let i = 1; i <= endDate.getDate(); i++) {
                const d = new Date(date + "-" + (i < 10 ? "0" + i : i));
                let item = {
                    id: i.toString(),
                    pressable:
                        d >= new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                    isToday:
                        i === today.getDate() &&
                        Number(date.split("-")[1]) === today.getMonth() + 1 &&
                        Number(date.split("-")[0]) === today.getFullYear(),
                };
                if (d.getDay() === 0) {
                    item["color"] = "red";
                } else if (holidayList[i]) {
                    item["color"] = "red";
                } else if (d.getDay() === 6) {
                    item["color"] = "blue";
                } else {
                    item["color"] = "black";
                }
                if (i === Number(classDate[index])) {
                    item["hasClass"] = true;
                    index += 1;
                } else {
                    item["hasClass"] = false;
                }
                items.push(item);
            }
            for (let i = 0; i < 6 - endDate.getDay(); i++) {
                items.push({ id: " ", pressable: false, isHeader: true });
            }
            setData(items);
            setCloading(false);
        };
        showCalendar();
    }, []);

    useEffect(() => {
        const getClass = async () => {
            let avail = true;
            if (classname === "pilates" || classname === "squash") {
                const weekDayDates = [...Array(5).keys()].map((x) =>
                    moment(new Date(date + "-" + (selectDate < 10 ? "0" + selectDate : selectDate)))
                        .weekday(x + 1)
                        .toDate()
                        .getDate()
                        .toString()
                );
                let hasReservation = 0;
                const promises = weekDayDates.map(async (d) => {
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("reservation")
                        .doc(date)
                        .collection(d)
                        .where("className", "==", classname)
                        .get()
                        .then((docs) => {
                            hasReservation = hasReservation + docs.size;
                        });
                });
                await Promise.all(promises);
                if (hasReservation >= route.params.week) {
                    avail = false;
                }
            }
            setAvailReserve(avail);
            let list = [];
            await db
                .collection("classes")
                .doc(classname)
                .collection("class")
                .doc(date)
                .collection(selectDate.toString())
                .orderBy("start", "asc")
                .get()
                .then((snapshots) => {
                    snapshots.forEach((snapshot) => {
                        let c = {};
                        const data = snapshot.data();
                        const start = data.start.toDate();
                        const end = data.end.toDate();
                        c["cid"] = snapshot.id;
                        c["trainer"] = data.trainer;
                        c["currentClient"] = data.currentClient;
                        c["maxClient"] = data.maxClient;
                        c["start"] = moment(start).format("HH:mm");
                        c["startDate"] = start;
                        c["end"] = moment(end).format("HH:mm");
                        c["isToday"] = today.getDate() === selectDate;
                        list.push(c);
                    });
                });
            setClassList(list);
        };
        if (selectDate !== 0) {
            getClass();
        } else {
            setClassList([]);
        }
    }, [selectDate]);

    const reserveClass = async (cid) => {
        const reserveDate = new Date();
        const classInDB = db
            .collection("classes")
            .doc(classname)
            .collection("class")
            .doc(date)
            .collection(selectDate.toString())
            .doc(cid);
        const { currentClient, maxClient, start, end, trainer } = (await classInDB.get()).data();
        const sub = (start.toDate().getTime() - reserveDate.getTime()) / 60000;
        console.log(sub);
        if (currentClient >= maxClient) {
            Alert.alert(
                "경고",
                "예약 가능한 자리가 없습니다.",
                [
                    {
                        text: "확인",
                        onPress: () => {
                            setModalClass(false);
                        },
                    },
                ],
                { cancelable: false }
            );
        } else if (sub <= 180) {
            Alert.alert(
                "경고",
                "수업 시작 3시간전까지만 예약 가능합니다.",
                [
                    {
                        text: "확인",
                        onPress: () => {
                            setModalClass(false);
                        },
                    },
                ],
                { cancelable: false }
            );
        } else {
            await classInDB
                .collection("clients")
                .where("uid", "==", uid)
                .limit(1)
                .get()
                .then(async (clients) => {
                    if (clients.size === 0) {
                        await classInDB.collection("clients").doc(uid).set({
                            uid: uid,
                        });
                        await classInDB.update({
                            currentClient: currentClient + 1,
                        });
                        await db
                            .collection("users")
                            .doc(uid)
                            .collection("reservation")
                            .doc(date)
                            .collection(selectDate.toString())
                            .doc(cid)
                            .set({
                                classId: cid,
                                start: start,
                                end: end,
                                trainer: trainer,
                                className: classname,
                            });
                        await db
                            .collection("users")
                            .doc(uid)
                            .collection("reservation")
                            .doc(date)
                            .update({
                                date: arrayUnion(selectDate.toString()),
                            })
                            .catch((error) => {
                                db.collection("users")
                                    .doc(uid)
                                    .collection("reservation")
                                    .doc(date)
                                    .set({ date: [selectDate.toString()] });
                            });
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: "수업 예약 미리 알림",
                                body: "예약하신 수업 시작까지 2시간 남았습니다.",
                                sound: "default",
                                badge: 1,
                            },
                            trigger: new Date(start.toDate().getTime() - 120 * 60 * 1000),
                        });
                        Alert.alert(
                            "성공",
                            "예약되었습니다.",
                            [
                                {
                                    text: "확인",
                                    onPress: () => {
                                        setModalClass(false);
                                        setSelectDate(0);
                                    },
                                },
                            ],
                            { cancelable: false }
                        );
                    } else {
                        clients.forEach((client) => {
                            if (client.exists) {
                                Alert.alert(
                                    "경고",
                                    "이미 예약되었습니다.",
                                    [
                                        {
                                            text: "확인",
                                            onPress: () => {
                                                setModalClass(false);
                                                setSelectDate(0);
                                            },
                                        },
                                    ],
                                    { cancelable: false }
                                );
                            }
                        });
                    }
                });
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {cloading ? (
                <View style={{ flex: 1, justifyContent: "center" }}>
                    <ActivityIndicator animating={true} size="large" color={Colors.black} />
                </View>
            ) : (
                <FlatList
                    data={data}
                    windowSize={1}
                    renderItem={({ item }) => (
                        <Surface
                            style={{
                                flex: 1,
                                flexDirection: "column",
                                margin: 5,
                                elevation: 4,
                                borderRadius: 10,
                            }}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.day,
                                    item.isHeader
                                        ? { backgroundColor: "white" }
                                        : item.hasClass
                                        ? { backgroundColor: "white" }
                                        : { backgroundColor: "#b3b3b3" },
                                ]}
                                onPress={() => {
                                    setModalClass(item.pressable);
                                    setSelectDate(Number(item.id));
                                }}
                                disabled={!item.pressable}
                            >
                                <View
                                    style={
                                        item.isToday
                                            ? {
                                                  backgroundColor: "#99ddff",
                                                  borderRadius: 50,
                                                  width: wp("8%"),
                                                  height: wp("8%"),
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                              }
                                            : undefined
                                    }
                                >
                                    <Text
                                        style={[
                                            TextSize.largeSize,
                                            item.color === "black"
                                                ? { color: "black" }
                                                : item.color === "blue"
                                                ? { color: "blue" }
                                                : { color: "red" },
                                        ]}
                                    >
                                        {item.id}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </Surface>
                    )}
                    numColumns={7}
                    keyExtractor={(item, index) => index}
                />
            )}
            <View style={{ backgroundColor: "#3366cc", height: hp("6%"), width: "100%" }} />
            <Modal
                isVisible={modalClass}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => setModalClass(false)}
                onBackButtonPress={() => setModalClass(false)}
            >
                <View
                    style={{
                        height: hp("90%"),
                        backgroundColor: "rgb(250, 250, 250)",
                    }}
                >
                    <View style={{ flexDirection: "row", backgroundColor: "#3366cc" }}>
                        <Button
                            onPress={() => {
                                setModalClass(false);
                                setSelectDate(0);
                            }}
                            labelStyle={[TextSize.largeSize, { color: "white" }]}
                        >
                            닫기
                        </Button>
                        <View style={{ flex: 7 }} />
                    </View>
                    <ScrollView
                        style={{
                            flex: 10,
                            paddingTop: 20,
                            alignSelf: "stretch",
                        }}
                        contentContainerStyle={{ alignItems: "center" }}
                    >
                        {classList.map((c, index) => (
                            <Surface key={index} style={MyStyles.surface}>
                                <TouchableOpacity
                                    style={MyStyles.menu}
                                    onPress={() => {
                                        if (availReserve) {
                                            Alert.alert(
                                                selectDate.toString() +
                                                    "일 " +
                                                    c.start +
                                                    "~" +
                                                    c.end,
                                                "확실합니까?",
                                                [
                                                    { text: "취소" },
                                                    {
                                                        text: "확인",
                                                        onPress: () => reserveClass(c.cid),
                                                    },
                                                ],
                                                { cancelable: false }
                                            );
                                        } else {
                                            Alert.alert(
                                                "경고",
                                                `이미 주${route.params.week}회 예약하셨습니다.`,
                                                [{ text: "확인" }],
                                                { cancelable: false }
                                            );
                                        }
                                    }}
                                    disabled={c.startDate.getTime() - today.getTime() < 1}
                                >
                                    <Text style={[TextSize.largeSize, { marginBottom: 5 }]}>
                                        {selectDate}일 {c.start}~{c.end} ({c.currentClient}/
                                        {c.maxClient})
                                    </Text>
                                    <Text style={TextSize.largeSize}>트레이너 : {c.trainer}</Text>
                                </TouchableOpacity>
                            </Surface>
                        ))}
                        {classList.length === 0 ? (
                            <Text style={TextSize.largeSize}>수업이 없습니다.</Text>
                        ) : undefined}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    day: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        height: wp("14%"),
        backgroundColor: "grey",
        borderRadius: 10,
    },
});
