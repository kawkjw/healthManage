import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import myBase, { arrayUnion, db } from "../../../config/MyBase";
import moment from "moment";
import { getHoliday } from "../../../config/hooks";
import Modal from "react-native-modal";
import { ActivityIndicator, Button, Colors, Surface, Text } from "react-native-paper";
import * as Notifications from "expo-notifications";
import GxSeat from "../../../components/GxSeat";
import ToHome from "../../../components/ToHome";

export default GX = ({ navigation, route }) => {
    const uid = myBase.auth().currentUser.uid;
    const { classname, date, end } = route.params;
    const today = new Date();
    const [data, setData] = useState([]);
    const [modalClass, setModalClass] = useState(false);
    const [selectDate, setSelectDate] = useState(0);
    const [classList, setClassList] = useState([]);
    const [availReserve, setAvailReserve] = useState(false);
    const [cloading, setCloading] = useState(true);
    const [modalSeat, setModalSeat] = useState(false);
    const [clientsForSeat, setClientsForSeat] = useState([]);
    const [selectClass, setSelectClass] = useState("");
    const [selectClassString, setSelectClassString] = useState("");
    const [gloading, setGloading] = useState(false);

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
            classDate.sort((a, b) => {
                return Number(a) - Number(b);
            });
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
                        d >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) &&
                        moment.duration(moment(end.toDate()).diff(moment(d))).asDays() >= 0,
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

    const getClass = useCallback(async () => {
        setGloading(true);
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
        await db
            .collection("classes")
            .doc(classname)
            .collection("class")
            .doc(date)
            .collection(selectDate.toString())
            .orderBy("start", "asc")
            .get()
            .then(async (snapshots) => {
                let list = [];
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
                    c["ref"] = snapshot.ref;
                    list.push(c);
                });
                if (classname === "spinning") {
                    const promises = list.map(async (c, i) => {
                        let clients = Array(28).fill(0);
                        await c.ref
                            .collection("clients")
                            .get()
                            .then((docs) => {
                                docs.forEach((doc) => {
                                    if (doc.id === uid) {
                                        clients[Number(doc.data().num) - 1] = 2;
                                    } else {
                                        clients[Number(doc.data().num) - 1] = 1;
                                    }
                                });
                            });
                        list[i]["clients"] = clients;
                    });
                    await Promise.all(promises);
                }
                return list;
            })
            .then((list) => {
                setClassList(list);
                setGloading(false);
            });
    }, [selectDate]);

    useEffect(() => {
        if (selectDate !== 0) {
            getClass();
        } else {
            setClassList([]);
        }
    }, [selectDate]);

    const reserveClass = async (cid, num = -1) => {
        const reserveDate = new Date();
        const classInDB = db
            .collection("classes")
            .doc(classname)
            .collection("class")
            .doc(date)
            .collection(selectDate.toString())
            .doc(cid);
        await db
            .collection("users")
            .doc(uid)
            .collection("reservation")
            .doc(date)
            .get()
            .then(async (doc) => {
                if (!doc.exists) {
                    await doc.ref.set({ date: [] });
                }
            });
        db.runTransaction(async (transaction) => {
            return await transaction.get(classInDB).then(async (doc) => {
                const { currentClient, maxClient, start, end, trainer } = doc.data();
                const sub = (start.toDate().getTime() - reserveDate.getTime()) / 60000;
                if (currentClient >= maxClient) {
                    return Promise.reject("No Remain Reserve");
                } else if (classname === "spinning") {
                    if (sub > 60 || sub < 0) {
                        return Promise.reject("Spinning Time Out");
                    }
                } else if (sub <= 60) {
                    return Promise.reject("Time Out");
                }
                return await transaction
                    .get(classInDB.collection("clients").doc(uid))
                    .then((clientDoc) => {
                        if (!clientDoc.exists) {
                            if (classname === "spinning") {
                                transaction.set(classInDB.collection("clients").doc(uid), {
                                    uid: uid,
                                    num: num,
                                });
                            } else {
                                transaction.set(classInDB.collection("clients").doc(uid), {
                                    uid: uid,
                                });
                            }
                            transaction.update(classInDB, {
                                currentClient: currentClient + 1,
                            });
                            let tempInfo = {
                                classId: cid,
                                start: start,
                                end: end,
                                trainer: trainer,
                                className: classname,
                            };
                            if (classname === "spinning") {
                                tempInfo["num"] = num;
                            }
                            transaction.set(
                                db
                                    .collection("users")
                                    .doc(uid)
                                    .collection("reservation")
                                    .doc(date)
                                    .collection(selectDate.toString())
                                    .doc(cid),
                                tempInfo
                            );
                            transaction.update(
                                db.collection("users").doc(uid).collection("reservation").doc(date),
                                {
                                    date: arrayUnion(selectDate.toString()),
                                }
                            );
                            return [true, start];
                        } else {
                            return Promise.reject("Already Reserved");
                        }
                    });
            });
        })
            .then(async (datas) => {
                if (datas[0]) {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: "수업 예약 미리 알림",
                            body: "예약하신 수업 시작까지 1시간 남았습니다.",
                            sound: "default",
                            badge: 1,
                        },
                        trigger: new Date(datas[1].toDate().getTime() - 60 * 60 * 1000),
                    }).catch((error) => console.log(error));
                    Alert.alert(
                        "성공",
                        "예약되었습니다.",
                        [
                            {
                                text: "확인",
                                onPress: () => {
                                    setModalSeat(false);
                                    setModalClass(false);
                                    setSelectDate(0);
                                },
                            },
                        ],
                        { cancelable: false }
                    );
                }
            })
            .catch((error) => {
                if (error === "No Remain Reserve") {
                    Alert.alert(
                        "경고",
                        "예약 가능한 자리가 없습니다.",
                        [
                            {
                                text: "확인",
                                onPress: () => {
                                    setModalSeat(false);
                                    setModalClass(false);
                                },
                            },
                        ],
                        { cancelable: false }
                    );
                } else if (error === "Spinning Time Out") {
                    Alert.alert(
                        "경고",
                        "수업 시작 1시간전부터 예약 가능합니다.",
                        [
                            {
                                text: "확인",
                                onPress: () => {
                                    setModalSeat(false);
                                    setModalClass(false);
                                },
                            },
                        ],
                        { cancelable: false }
                    );
                } else if (error === "Time Out") {
                    Alert.alert(
                        "경고",
                        "수업 시작 1시간전까지만 예약 가능합니다.",
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
                } else if (error === "Already Reserved") {
                    Alert.alert(
                        "경고",
                        "이미 예약되었습니다.",
                        [
                            {
                                text: "확인",
                                onPress: () => {
                                    setModalSeat(false);
                                    setModalClass(false);
                                    setSelectDate(0);
                                },
                            },
                        ],
                        { cancelable: false }
                    );
                }
                console.log(error);
            });
    };

    return (
        <View style={{ flex: 1 }}>
            <ToHome navigation={navigation} />
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
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
            <Modal
                isVisible={modalClass}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => {
                    setModalClass(false);
                    setSelectDate(0);
                }}
                onBackButtonPress={() => {
                    setModalClass(false);
                    setSelectDate(0);
                }}
            >
                <View
                    style={{
                        height: hp("90%"),
                        backgroundColor: "rgb(250, 250, 250)",
                    }}
                >
                    <View style={{ flexDirection: "row", backgroundColor: theme.colors.primary }}>
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
                        {gloading ? (
                            <View
                                style={{
                                    height: hp("80%"),
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ActivityIndicator color="black" size="large" />
                            </View>
                        ) : (
                            <>
                                {classname === "spinning" && (
                                    <View style={{ marginBottom: 10 }}>
                                        <Text style={TextSize.normalSize}>
                                            수업 시작 1시간전부터 예약 가능합니다.
                                        </Text>
                                    </View>
                                )}
                                {classList.map((c, index) => (
                                    <Surface
                                        key={index}
                                        style={[
                                            MyStyles.surface,
                                            classname === "spinning"
                                                ? moment
                                                      .duration(
                                                          moment(c.startDate).diff(moment(today))
                                                      )
                                                      .asHours() > 1 ||
                                                  moment
                                                      .duration(
                                                          moment(c.startDate).diff(moment(today))
                                                      )
                                                      .asHours() < 0
                                                    ? { backgroundColor: "lightgrey" }
                                                    : undefined
                                                : moment
                                                      .duration(
                                                          moment(c.startDate).diff(moment(today))
                                                      )
                                                      .asHours() < 1 && {
                                                      backgroundColor: "lightgrey",
                                                  },
                                        ]}
                                    >
                                        <TouchableOpacity
                                            style={MyStyles.menu}
                                            onPress={() => {
                                                if (availReserve) {
                                                    if (classname === "spinning") {
                                                        setSelectClass(c.cid);
                                                        setClientsForSeat(c.clients);
                                                        setSelectClassString(
                                                            `${selectDate}일 ${c.start}~${c.end}`
                                                        );
                                                        setModalSeat(true);
                                                    } else {
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
                                                                    onPress: () =>
                                                                        reserveClass(c.cid),
                                                                },
                                                            ],
                                                            { cancelable: false }
                                                        );
                                                    }
                                                } else {
                                                    Alert.alert(
                                                        "경고",
                                                        `이미 주${route.params.week}회 예약하셨습니다.`,
                                                        [{ text: "확인" }],
                                                        { cancelable: false }
                                                    );
                                                }
                                            }}
                                            disabled={
                                                classname === "spinning"
                                                    ? moment
                                                          .duration(
                                                              moment(c.startDate).diff(
                                                                  moment(today)
                                                              )
                                                          )
                                                          .asHours() > 1 ||
                                                      moment
                                                          .duration(
                                                              moment(c.startDate).diff(
                                                                  moment(today)
                                                              )
                                                          )
                                                          .asHours() < 0
                                                    : moment
                                                          .duration(
                                                              moment(c.startDate).diff(
                                                                  moment(today)
                                                              )
                                                          )
                                                          .asHours() < 1
                                            }
                                        >
                                            <Text
                                                style={[
                                                    TextSize.largeSize,
                                                    { marginBottom: 5 },
                                                    classname === "spinning"
                                                        ? moment
                                                              .duration(
                                                                  moment(c.startDate).diff(
                                                                      moment(today)
                                                                  )
                                                              )
                                                              .asHours() > 1 ||
                                                          moment
                                                              .duration(
                                                                  moment(c.startDate).diff(
                                                                      moment(today)
                                                                  )
                                                              )
                                                              .asHours() < 0
                                                            ? {
                                                                  color: "dimgrey",
                                                              }
                                                            : undefined
                                                        : moment
                                                              .duration(
                                                                  moment(c.startDate).diff(
                                                                      moment(today)
                                                                  )
                                                              )
                                                              .asHours() < 1 && {
                                                              color: "dimgrey",
                                                          },
                                                ]}
                                            >
                                                {selectDate}일 {c.start}~{c.end} ({c.currentClient}/
                                                {c.maxClient})
                                            </Text>
                                            <Text
                                                style={[
                                                    TextSize.largeSize,
                                                    classname === "spinning"
                                                        ? moment
                                                              .duration(
                                                                  moment(c.startDate).diff(
                                                                      moment(today)
                                                                  )
                                                              )
                                                              .asHours() > 1 ||
                                                          moment
                                                              .duration(
                                                                  moment(c.startDate).diff(
                                                                      moment(today)
                                                                  )
                                                              )
                                                              .asHours() < 0
                                                            ? {
                                                                  color: "dimgrey",
                                                              }
                                                            : undefined
                                                        : moment
                                                              .duration(
                                                                  moment(c.startDate).diff(
                                                                      moment(today)
                                                                  )
                                                              )
                                                              .asHours() < 1 && {
                                                              color: "dimgrey",
                                                          },
                                                ]}
                                            >
                                                트레이너 : {c.trainer}
                                            </Text>
                                        </TouchableOpacity>
                                    </Surface>
                                ))}
                                {classList.length === 0 ? (
                                    <Text style={TextSize.largeSize}>수업이 없습니다.</Text>
                                ) : undefined}
                            </>
                        )}
                    </ScrollView>
                </View>
                <Modal
                    isVisible={modalSeat}
                    style={{ justifyContent: "flex-end", margin: 0 }}
                    onBackdropPress={() => {
                        setModalSeat(false);
                        setSelectClassString("");
                    }}
                    onBackButtonPress={() => {
                        setModalSeat(false);
                        setSelectClassString("");
                    }}
                >
                    <View
                        style={{
                            height: hp("80%"),
                            backgroundColor: "rgb(250, 250, 250)",
                        }}
                    >
                        <View
                            style={{ flexDirection: "row", backgroundColor: theme.colors.primary }}
                        >
                            <Button
                                onPress={() => {
                                    setModalSeat(false);
                                    setSelectClassString("");
                                }}
                                labelStyle={[TextSize.largeSize, { color: "white" }]}
                            >
                                닫기
                            </Button>
                            <View
                                style={{ flex: 6, alignItems: "center", justifyContent: "center" }}
                            >
                                <Text style={[TextSize.largeSize, { color: "white" }]}>
                                    {selectClassString}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }} />
                        </View>
                        <GxSeat
                            permit="client"
                            clientList={clientsForSeat}
                            onPress={reserveClass}
                            cid={selectClass}
                        />
                    </View>
                </Modal>
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
