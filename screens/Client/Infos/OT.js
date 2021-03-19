import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
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
import { TextSize } from "../../../css/MyStyles";
import Modal from "react-native-modal";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Surface } from "react-native-paper";

export default OT = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const { trainerName, trainerUid } = route.params;
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

    useEffect(() => {
        const showCalendar = async () => {
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
                .doc("pt")
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
            .doc("pt")
            .collection(trainerUid)
            .doc(yearMonthStr)
            .collection(selectedDate.toString())
            .get()
            .then((snapshots) => {
                snapshots.forEach(async (snapshot) => {
                    let ptClass = {};
                    ptClass["timeStr"] = snapshot.id;
                    ptClass["isAvail"] = snapshot.data().isAvail;
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
        let healthId = "";
        await db
            .collection("users")
            .doc(uid)
            .collection("memberships")
            .doc("list")
            .collection("health")
            .orderBy("payDay", "desc")
            .limit(1)
            .get()
            .then((docs) => {
                docs.forEach((doc) => {
                    if (doc.data().otCount !== undefined) {
                        count = doc.data().otCount;
                    } else {
                        count = 2;
                    }
                    healthId = doc.id;
                });
            });
        if (count <= 0) {
            Alert.alert(
                "경고",
                "남은 OT 횟수가 없습니다. ",
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
                .doc("pt")
                .collection(trainerUid)
                .doc(yearMonthStr)
                .collection(selectedDate.toString())
                .doc(timeStr);
            await classDBInTimeStr.get().then(async (snapshot) => {
                if (!snapshot.data().hasReservation) {
                    await classDBInTimeStr.update({
                        hasReservation: true,
                        confirm: false,
                        clientUid: uid,
                        ot: true,
                    });
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
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("reservation")
                        .doc(yearMonthStr)
                        .collection(selectedDate.toString())
                        .doc(timeStr)
                        .set({
                            classId: "ot",
                            className: "ot",
                            start: startDate,
                            end: endDate,
                            trainer: trainerName,
                            confirm: false,
                        });
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("reservation")
                        .doc(yearMonthStr)
                        .update({ date: arrayUnion(selectedDate.toString()) })
                        .catch(async (error) => {
                            await db
                                .collection("users")
                                .doc(uid)
                                .collection("reservation")
                                .doc(yearMonthStr)
                                .set({ date: [selectedDate.toString()] });
                        });
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("memberships")
                        .doc("list")
                        .collection("health")
                        .doc(healthId)
                        .set({ otCount: count - 1 }, { merge: true });
                    await pushNotificationsToPerson(
                        myBase.auth().currentUser.displayName,
                        trainerUid,
                        "새 OT 예약",
                        `${selectedDate}일 ${timeStr}`,
                        {
                            navigation: "PT",
                            datas: {
                                year: selectedYear,
                                month: selectedMonth,
                                date: selectedDate,
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
                } else {
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
                }
            });
        }
    };

    return (
        <View style={{ flex: 1 }}>
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
            <View style={{ backgroundColor: "#3366cc", height: hp("6%"), width: "100%" }} />
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
                    <View style={{ flexDirection: "row", height: hp("5%") }}>
                        <TouchableOpacity
                            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                            onPress={() => {
                                setModalTimeTable(false);
                                setSelectedDate(0);
                            }}
                        >
                            <Text style={TextSize.largeSize}>닫기</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 6, alignItems: "center", justifyContent: "center" }}>
                            <Text style={TextSize.largeSize}>{selectedDate + "일"}</Text>
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
                            <Image
                                style={{ width: 50, height: 50 }}
                                source={require("../../../assets/loading.gif")}
                            />
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
                                            flex: 1,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            paddingLeft: 10,
                                        }}
                                    >
                                        <Text style={TextSize.normalSize}>{availTime.timeStr}</Text>
                                    </View>
                                    <View
                                        style={{
                                            flex: 3,
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
                                                        예약 안됨
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
                                            ) : availTime.isToday ? null : (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.availButton,
                                                        {
                                                            backgroundColor: "white",
                                                            height: hp("7%"),
                                                        },
                                                    ]}
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
                                                    <Text style={TextSize.normalSize}>예약</Text>
                                                </TouchableOpacity>
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
        borderWidth: 1,
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
