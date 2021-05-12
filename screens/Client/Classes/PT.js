import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import myBase, { arrayUnion, db } from "../../../config/MyBase";
import SegmentedPicker from "react-native-segmented-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { pushNotificationsToPerson } from "../../../config/MyExpo";
import { getHoliday } from "../../../config/hooks";
import { TextSize, theme } from "../../../css/MyStyles";
import Modal from "react-native-modal";
import { RFPercentage } from "react-native-responsive-fontsize";
import { ActivityIndicator, Button, Colors, Surface, Text } from "react-native-paper";
import moment from "moment";
import * as Notifications from "expo-notifications";
import ToHome from "../../../components/ToHome";

export default PT = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const { trainerName, trainerUid, ptName } = route.params;
    const uid = myBase.auth().currentUser.uid;
    const today = new Date();
    const [data, setData] = useState([]);
    const [change, setChange] = useState(true);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const picker = useRef();
    const [yearList, setYearList] = useState([]);
    const [monthList, setMonthList] = useState([]);
    const [selections, setSelections] = useState({
        year: today.getFullYear().toString(),
        month: (today.getMonth() + 1).toString(),
    });
    const [selectedDate, setSelectedDate] = useState(0);
    const [modalTimeTable, setModalTimeTable] = useState(false);
    const [availTimeList, setAvailTimeList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cloading, setCloading] = useState(true);

    useEffect(() => {
        const showCalendar = async () => {
            setCloading(true);
            const yearMonthStr =
                selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);

            let items = [
                { id: "일", color: "red", pressable: false, isHeader: true },
                { id: "월", color: "black", pressable: false, isHeader: true },
                { id: "화", color: "black", pressable: false, isHeader: true },
                { id: "수", color: "black", pressable: false, isHeader: true },
                { id: "목", color: "black", pressable: false, isHeader: true },
                { id: "금", color: "black", pressable: false, isHeader: true },
                { id: "토", color: "blue", pressable: false, isHeader: true },
            ];
            const firstDate = new Date(yearMonthStr + "-01");
            for (let i = 0; i < firstDate.getDay(); i++) {
                items.push({ id: " ", pressable: false, isHeader: true });
            }
            let classDate = [];
            await db
                .collection("classes")
                .doc(ptName)
                .collection(trainerUid)
                .doc(yearMonthStr)
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
            const endDate = new Date(selectedYear, selectedMonth, 0);
            const holidayList = await getHoliday(selectedYear, selectedMonth);

            for (let i = 1; i <= endDate.getDate(); i++) {
                const d = new Date(yearMonthStr + "-" + (i < 10 ? "0" + i : i));
                let item = {
                    id: i.toString(),
                    pressable:
                        d >= new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                    isToday:
                        i === today.getDate() &&
                        selectedMonth === today.getMonth() + 1 &&
                        selectedYear === today.getFullYear(),
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
                    item["pressable"] = false;
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
    }, [change]);

    useEffect(() => {
        const setListForPicker = () => {
            let list = [];
            for (let i = today.getFullYear() - 10; i <= today.getFullYear() + 10; i++) {
                list.push({
                    label: i.toString(),
                    value: i.toString(),
                    key: i.toString(),
                });
            }
            setYearList(list);
            list = [];
            for (let i = 1; i <= 12; i++) {
                list.push({
                    label: i.toString(),
                    value: i.toString(),
                    key: i.toString(),
                });
            }
            setMonthList(list);
        };
        setListForPicker();
    }, []);

    const showTimeTable = async () => {
        setLoading(true);
        let timeList = [];
        const yearMonthStr =
            selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        await db
            .collection("classes")
            .doc(ptName)
            .collection(trainerUid)
            .doc(yearMonthStr)
            .collection(selectedDate.toString())
            .get()
            .then((snapshots) => {
                snapshots.forEach(async (snapshot) => {
                    let ptClass = {};
                    ptClass["timeStr"] = snapshot.id;
                    ptClass["isAvail"] = snapshot.data().isAvail;
                    ptClass["date"] = moment(
                        `${yearMonthStr}-${selectedDate} ${snapshot.id.split(" ")[0]}`,
                        "YYYY-MM-DD hh:mm"
                    ).toDate();
                    if (snapshot.data().isAvail) {
                        ptClass["hasReserve"] = snapshot.data().hasReservation;
                        if (snapshot.data().hasReservation) {
                            if (snapshot.data().clientUid === uid) {
                                ptClass["isMe"] = true;
                            }
                        }
                    }
                    ptClass["isToday"] = today.getDate() === selectedDate;
                    timeList.push(ptClass);
                });
            });
        setAvailTimeList(timeList);
        setLoading(false);
    };

    useEffect(() => {
        if (selectedDate !== 0) {
            showTimeTable();
        }
    }, [selectedDate]);

    const goPreMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(selectedYear - 1);
            setSelections({ year: (selectedYear - 1).toString(), month: "12" });
        } else {
            setSelectedMonth(selectedMonth - 1);
            setSelections({ year: selectedYear.toString(), month: (selectedMonth - 1).toString() });
        }
        setChange(!change);
    };

    const goNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(selectedYear + 1);
            setSelections({ year: (selectedYear + 1).toString(), month: "1" });
        } else {
            setSelectedMonth(selectedMonth + 1);
            setSelections({ year: selectedYear.toString(), month: (selectedMonth + 1).toString() });
        }
        setChange(!change);
    };

    const reservePTClass = async (timeStr) => {
        let count = 0;
        let ptId = "";
        let isGroup = false;
        let price = 0;
        let initialCount = 0;
        await db
            .collection("users")
            .doc(uid)
            .collection("memberships")
            .doc("list")
            .collection(ptName === "pt" ? ptName : ptName + "pt")
            .orderBy("payDay", "desc")
            .limit(1)
            .get()
            .then((docs) => {
                docs.forEach((doc) => {
                    count = doc.data().count;
                    initialCount = doc.data().initialCount;
                    price = doc.data().price;
                    ptId = doc.id;
                    if (ptName === "pt") {
                        isGroup = doc.data().group;
                    }
                });
            });
        if (count <= 0) {
            Alert.alert(
                "경고",
                "남은 PT 횟수가 없습니다. ",
                [
                    {
                        text: "확인",
                        onPress: () => {
                            navigation.reset({
                                index: 1,
                                routes: [{ name: "HomeScreen" }],
                            });
                        },
                    },
                ],
                { cancelable: false }
            );
            return;
        } else {
            const yearMonthStr =
                selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
            const classDBInTimeStr = db
                .collection("classes")
                .doc(ptName)
                .collection(trainerUid)
                .doc(yearMonthStr)
                .collection(selectedDate.toString())
                .doc(timeStr);
            await db
                .collection("users")
                .doc(uid)
                .collection("reservation")
                .doc(yearMonthStr)
                .get()
                .then(async (doc) => {
                    if (!doc.exists) {
                        await doc.ref.set({ date: [] });
                    }
                });
            db.runTransaction(async (transaction) => {
                return await transaction.get(classDBInTimeStr).then(async (doc) => {
                    if (!doc.data().hasReservation) {
                        const identifier = await Notifications.scheduleNotificationAsync({
                            content: {
                                title: "수업 예약 미리 알림",
                                body: "예약하신 PT 수업이 시작까지 2시간 남았습니다.",
                                sound: "default",
                                badge: 1,
                            },
                            trigger: new Date(
                                selectedYear,
                                selectedMonth - 1,
                                selectedDate,
                                Number(timeStr.split(":")[0]) - 2,
                                0
                            ),
                        });
                        transaction.update(classDBInTimeStr, {
                            hasReservation: true,
                            confirm: false,
                            clientUid: uid,
                            isGroup: isGroup,
                            notiIdentifier: identifier,
                            priceByMembership: Math.floor(price / initialCount),
                        });
                        transaction.update(
                            db
                                .collection("classes")
                                .doc(ptName)
                                .collection(trainerUid)
                                .doc(yearMonthStr),
                            { waitConfirm: arrayUnion(selectedDate.toString()) }
                        );
                        const startDate = new Date(
                            selectedYear,
                            selectedMonth - 1,
                            selectedDate,
                            timeStr.substr(0, 2)
                        );
                        const endDate = new Date(
                            selectedYear,
                            selectedMonth - 1,
                            selectedDate,
                            timeStr.substr(8, 2)
                        );
                        transaction.set(
                            db
                                .collection("users")
                                .doc(uid)
                                .collection("reservation")
                                .doc(yearMonthStr)
                                .collection(selectedDate.toString())
                                .doc(timeStr),
                            {
                                classId: ptName === "pt" ? ptName : ptName + "pt",
                                className: ptName === "pt" ? ptName : ptName + "pt",
                                start: startDate,
                                end: endDate,
                                trainer: trainerName,
                                confirm: false,
                            }
                        );
                        transaction.update(
                            db
                                .collection("users")
                                .doc(uid)
                                .collection("reservation")
                                .doc(yearMonthStr),
                            { date: arrayUnion(selectedDate.toString()) }
                        );
                        transaction.update(
                            db
                                .collection("users")
                                .doc(uid)
                                .collection("memberships")
                                .doc("list")
                                .collection(ptName === "pt" ? ptName : ptName + "pt")
                                .doc(ptId),
                            { count: count - 1 }
                        );
                        return [true, identifier];
                    } else {
                        return Promise.reject("Already Reserved");
                    }
                });
            })
                .then(async (datas) => {
                    if (datas[0]) {
                        await pushNotificationsToPerson(
                            myBase.auth().currentUser.displayName,
                            trainerUid,
                            "새 PT 예약",
                            `${selectedDate}일 ${timeStr}`,
                            {
                                navigation: "PT",
                                datas: {
                                    year: selectedYear,
                                    month: selectedMonth,
                                    date: selectedDate,
                                    identifier: datas[1],
                                },
                            }
                        );
                        Alert.alert(
                            "성공",
                            "수업이 예약되었습니다.",
                            [
                                {
                                    text: "확인",
                                    onPress: () => {
                                        const backup = selectedDate;
                                        setSelectedDate(0);
                                        setSelectedDate(backup);
                                    },
                                },
                            ],
                            { cancelable: false }
                        );
                    }
                })
                .catch((error) => {
                    if (error === "Already Reserved")
                        Alert.alert(
                            "실패",
                            "이미 예약되어 있습니다.",
                            [
                                {
                                    text: "확인",
                                    onPress: () => {
                                        const backup = selectedDate;
                                        setSelectedDate(0);
                                        setSelectedDate(backup);
                                    },
                                },
                            ],
                            { cancelable: false }
                        );
                });
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ToHome navigation={navigation} />
            <View style={{ flexDirection: "row", height: hp("5%") }}>
                <View
                    style={{
                        flex: 1,
                        alignItems: "flex-start",
                        justifyContent: "center",
                        paddingLeft: 10,
                    }}
                >
                    <TouchableOpacity activeOpacity={0.5} onPress={goPreMonth}>
                        <MaterialIcons name="chevron-left" size={RFPercentage(4)} color="black" />
                    </TouchableOpacity>
                </View>
                <View
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <TouchableOpacity onPress={() => picker.current.show()}>
                        <Text style={TextSize.largerSize}>
                            {selectedYear +
                                "-" +
                                (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth)}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View
                    style={{
                        flex: 1,
                        alignItems: "flex-end",
                        justifyContent: "center",
                        paddingRight: 10,
                    }}
                >
                    <TouchableOpacity activeOpacity={0.5} onPress={goNextMonth}>
                        <MaterialIcons name="chevron-right" size={RFPercentage(4)} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
            {cloading ? (
                <View style={{ flex: 1, justifyContent: "center" }}>
                    <ActivityIndicator animating={true} color={Colors.black} size="large" />
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
                                    setModalTimeTable(item.pressable);
                                    setSelectedDate(Number(item.id));
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
                    scrollEnabled={false}
                />
            )}
            <SegmentedPicker
                ref={picker}
                onConfirm={(select) => {
                    setSelections(select);
                    setSelectedYear(Number(select.year));
                    setSelectedMonth(Number(select.month));
                    setChange(!change);
                }}
                confirmText="확인"
                defaultSelections={selections}
                options={[
                    {
                        key: "year",
                        items: yearList,
                    },
                    {
                        key: "month",
                        items: monthList,
                    },
                ]}
            />
            <Modal
                isVisible={modalTimeTable}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => setModalTimeTable(false)}
                onBackButtonPress={() => setModalTimeTable(false)}
            >
                <View
                    style={{
                        height: hp("90%"),
                        backgroundColor: "white",
                    }}
                >
                    <View style={{ flexDirection: "row", backgroundColor: theme.colors.primary }}>
                        <Button
                            onPress={() => {
                                setModalTimeTable(false);
                                setSelectedDate(0);
                            }}
                            labelStyle={[TextSize.largeSize, { color: "white" }]}
                        >
                            닫기
                        </Button>
                        <View style={{ flex: 6, alignItems: "center", justifyContent: "center" }}>
                            <Text style={[TextSize.largeSize, { color: "white" }]}>
                                {selectedDate + "일"}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }} />
                    </View>
                    {loading ? (
                        <View
                            style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ActivityIndicator animating={true} size="large" color="black" />
                        </View>
                    ) : (
                        <ScrollView
                            style={{
                                flex: 10,
                                paddingTop: 20,
                                alignSelf: "stretch",
                                marginHorizontal: 10,
                            }}
                            contentContainerStyle={{ alignItems: "center" }}
                        >
                            {availTimeList.map((availTime, index) => (
                                <View
                                    key={index}
                                    style={[
                                        {
                                            flex: 1,
                                            width: width,
                                            height: hp("10%"),
                                            borderBottomWidth: 1,
                                            borderBottomColor: "grey",
                                            flexDirection: "row",
                                            paddingHorizontal: 10,
                                        },
                                        index === 0
                                            ? {
                                                  borderTopWidth: 1,
                                                  borderTopColor: "grey",
                                              }
                                            : undefined,
                                    ]}
                                >
                                    <View
                                        style={{
                                            flex: 2,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            paddingLeft: 10,
                                        }}
                                    >
                                        <Text style={TextSize.normalSize}>{availTime.timeStr}</Text>
                                    </View>
                                    <View
                                        style={{
                                            flex: 4,
                                            flexDirection: "row",
                                            marginLeft: 10,
                                            paddingHorizontal: 10,
                                            marginBottom: 15,
                                            marginTop: 10,
                                            alignItems: "center",
                                        }}
                                    >
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            {availTime.isAvail ? (
                                                availTime.hasReserve ? (
                                                    <Text style={TextSize.normalSize}>
                                                        이미 예약됨 {availTime.isMe ? "(나)" : null}
                                                    </Text>
                                                ) : (
                                                    <Text style={TextSize.normalSize}>
                                                        예약 없음
                                                    </Text>
                                                )
                                            ) : (
                                                <Text
                                                    style={[
                                                        TextSize.normalSize,
                                                        {
                                                            color: "red",
                                                        },
                                                    ]}
                                                >
                                                    불가능
                                                </Text>
                                            )}
                                        </View>
                                        {availTime.isAvail ? (
                                            availTime.hasReserve ? (
                                                availTime.isToday ? null : (
                                                    <View style={{ flex: 1 }} />
                                                )
                                            ) : availTime.isToday ? (
                                                (availTime.date.getTime() - today.getTime()) /
                                                    60000 <=
                                                60 ? null : (
                                                    <Surface
                                                        style={{
                                                            flex: 1,
                                                            borderRadius: 15,
                                                            elevation: 6,
                                                        }}
                                                    >
                                                        <TouchableOpacity
                                                            style={{
                                                                height: hp("7%"),
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                            onPress={() => {
                                                                Alert.alert(
                                                                    selectedDate.toString() +
                                                                        "일 " +
                                                                        availTime.timeStr,
                                                                    "확실합니까?",
                                                                    [
                                                                        {
                                                                            text: "취소",
                                                                        },
                                                                        {
                                                                            text: "확인",
                                                                            onPress: () =>
                                                                                reservePTClass(
                                                                                    availTime.timeStr
                                                                                ),
                                                                        },
                                                                    ],
                                                                    { cancelable: false }
                                                                );
                                                            }}
                                                        >
                                                            <Text style={TextSize.normalSize}>
                                                                예약
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </Surface>
                                                )
                                            ) : (
                                                <Surface
                                                    style={{
                                                        flex: 1,
                                                        borderRadius: 15,
                                                        elevation: 6,
                                                    }}
                                                >
                                                    <TouchableOpacity
                                                        style={{
                                                            height: hp("7%"),
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                        onPress={() => {
                                                            Alert.alert(
                                                                selectedDate.toString() +
                                                                    "일 " +
                                                                    availTime.timeStr,
                                                                "확실합니까?",
                                                                [
                                                                    {
                                                                        text: "취소",
                                                                    },
                                                                    {
                                                                        text: "확인",
                                                                        onPress: () =>
                                                                            reservePTClass(
                                                                                availTime.timeStr
                                                                            ),
                                                                    },
                                                                ],
                                                                { cancelable: false }
                                                            );
                                                        }}
                                                    >
                                                        <Text style={TextSize.normalSize}>
                                                            예약
                                                        </Text>
                                                    </TouchableOpacity>
                                                </Surface>
                                            )
                                        ) : availTime.isToday ? null : (
                                            <View style={{ flex: 1 }} />
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </Modal>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
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
    availButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        borderColor: "grey",
        ...Platform.select({
            ios: {
                shadowColor: "#c6c6c6",
                shadowOffset: { width: 5, height: 5 },
                shadowOpacity: 5,
            },
            android: {
                elevation: 10,
            },
        }),
    },
});
