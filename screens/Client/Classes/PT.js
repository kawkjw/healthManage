import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
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
import { getStatusBarHeight } from "react-native-status-bar-height";
import { pushNotificationsToPerson } from "../../../config/MyExpo";
import { RFPercentage } from "react-native-responsive-fontsize";

export default PT = ({ navigation, route }) => {
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
                selectedYear +
                "-" +
                (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);

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
            classDate.sort();
            classDate.push("-1");
            let index = 0;
            const endDate = new Date(selectedYear, selectedMonth, 0);
            for (let i = 1; i <= endDate.getDate(); i++) {
                const d = new Date(yearMonthStr + "-" + (i < 10 ? "0" + i : i));
                let item = {
                    id: i.toString(),
                    pressable:
                        d >=
                        new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate()
                        ),
                    isToday:
                        i === today.getDate() &&
                        selectedMonth === today.getMonth() + 1 &&
                        selectedYear === today.getFullYear(),
                };
                if (d.getDay() === 0) {
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
            for (
                let i = today.getFullYear() - 10;
                i <= today.getFullYear() + 10;
                i++
            ) {
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
            selectedYear +
            "-" +
            (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
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
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
        setChange(!change);
    };

    const goNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
        setChange(!change);
    };

    const reservePTClass = async (timeStr) => {
        const { count } = (
            await db
                .collection("users")
                .doc(uid)
                .collection("memberships")
                .doc("pt")
                .get()
        ).data();
        if (count <= 0) {
            Alert.alert("Error", "No remained PT count", [
                {
                    text: "OK",
                    onPress: () => {
                        navigation.reset({
                            index: 1,
                            routes: [{ name: "HomeScreen" }],
                        });
                    },
                },
            ]);
            return;
        } else {
            const yearMonthStr =
                selectedYear +
                "-" +
                (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
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
                            classId: "pt",
                            className: "pt",
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
                        .update({ date: arrayUnion(selectedDate.toString()) });
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("memberships")
                        .doc("pt")
                        .update({ count: count - 1 });
                    Alert.alert("Success", "Reserved Class", [
                        {
                            text: "OK",
                            onPress: async () => {
                                await pushNotificationsToPerson(
                                    myBase.auth().currentUser.displayName,
                                    trainerUid,
                                    "New Reservation",
                                    "Please Check Reservation",
                                    {
                                        navigation: "PT",
                                        datas: {
                                            year: selectedYear,
                                            month: selectedMonth,
                                            date: selectedDate,
                                        },
                                    }
                                );
                                const backup = selectedDate;
                                setSelectedDate(0);
                                setSelectedDate(backup);
                            },
                        },
                    ]);
                } else {
                    Alert.alert("Failure", "Already Reserved", [
                        {
                            text: "OK",
                            onPress: () => {
                                const backup = selectedDate;
                                setSelectedDate(0);
                                setSelectedDate(backup);
                            },
                        },
                    ]);
                }
            });
        }
    };

    return (
        <SafeAreaView>
            <View style={{ flexDirection: "row", height: 30 }}>
                <View
                    style={{
                        flex: 1,
                        alignItems: "flex-start",
                        justifyContent: "center",
                        paddingLeft: 10,
                    }}
                >
                    <TouchableOpacity activeOpacity={0.5} onPress={goPreMonth}>
                        <MaterialIcons
                            name="chevron-left"
                            size={30}
                            color="black"
                        />
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
                        <Text style={{ fontSize: 20 }}>
                            {selectedYear +
                                "-" +
                                (selectedMonth < 10
                                    ? "0" + selectedMonth
                                    : selectedMonth)}
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
                        <MaterialIcons
                            name="chevron-right"
                            size={30}
                            color="black"
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <FlatList
                data={data}
                windowSize={1}
                renderItem={({ item }) => (
                    <View
                        style={{ flex: 1, flexDirection: "column", margin: 5 }}
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
                                    style={
                                        item.color === "black"
                                            ? { color: "black" }
                                            : item.color === "blue"
                                            ? { color: "blue" }
                                            : { color: "red" }
                                    }
                                >
                                    {item.id}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
                numColumns={7}
                keyExtractor={(item, index) => index}
            />
            <SegmentedPicker
                ref={picker}
                onConfirm={(select) => {
                    setSelections(select);
                    setSelectedYear(Number(select.year));
                    setSelectedMonth(Number(select.month));
                    setChange(!change);
                }}
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
                animationType="slide"
                visible={modalTimeTable}
                transparent={true}
            >
                <SafeAreaView
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                    }}
                >
                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            top:
                                Platform.OS === "ios"
                                    ? getStatusBarHeight()
                                    : 0,
                            left: 0,
                            margin: 10,
                            padding: 5,
                            zIndex: 1,
                        }}
                        onPress={() => {
                            setModalTimeTable(false);
                            setSelectedDate(0);
                        }}
                    >
                        <Text style={{ fontSize: RFPercentage(2) }}>Close</Text>
                    </TouchableOpacity>
                    <View style={{ height: 30 }}></View>
                    <Text
                        style={{
                            position: "absolute",
                            top:
                                Platform.OS === "ios"
                                    ? getStatusBarHeight() + 10
                                    : 0,
                            left: width / 2.15,
                            fontSize: RFPercentage(2.5),
                        }}
                    >
                        {selectedDate + "일"}
                    </Text>
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
                                        <Text
                                            style={{
                                                fontSize: RFPercentage(2),
                                            }}
                                        >
                                            {availTime.timeStr}
                                        </Text>
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
                                        <View style={{ flex: 1 }}>
                                            {availTime.isAvail ? (
                                                availTime.hasReserve ? (
                                                    <Text>
                                                        Already Reserved{" "}
                                                        {availTime.isMe
                                                            ? "(me)"
                                                            : null}
                                                    </Text>
                                                ) : (
                                                    <Text>No Reservation</Text>
                                                )
                                            ) : (
                                                <Text style={{ color: "red" }}>
                                                    Unavailable
                                                </Text>
                                            )}
                                        </View>
                                        {availTime.isAvail ? (
                                            availTime.hasReserve ? null : availTime.isToday ? null : (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.availButton,
                                                        {
                                                            backgroundColor:
                                                                "white",
                                                            height: hp("7%"),
                                                        },
                                                    ]}
                                                    onPress={() => {
                                                        Alert.alert(
                                                            selectedDate.toString() +
                                                                "일 " +
                                                                availTime.timeStr,
                                                            "Are you sure?",
                                                            [
                                                                {
                                                                    text:
                                                                        "Cancel",
                                                                },
                                                                {
                                                                    text: "OK",
                                                                    onPress: () =>
                                                                        reservePTClass(
                                                                            availTime.timeStr
                                                                        ),
                                                                },
                                                            ]
                                                        );
                                                    }}
                                                >
                                                    <Text>Reserve</Text>
                                                </TouchableOpacity>
                                            )
                                        ) : null}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    day: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        height: wp("14%"),
        backgroundColor: "grey",
        borderWidth: 1,
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
