import React, { useEffect, useRef, useState } from "react";
import {
    Text,
    SafeAreaView,
    View,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Modal,
    Dimensions,
    ScrollView,
    Platform,
    Alert,
    Image,
} from "react-native";
import myBase, { arrayUnion, db } from "../../../config/MyBase";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import SegmentedPicker from "react-native-segmented-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { getStatusBarHeight } from "react-native-status-bar-height";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default PT = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const uid = myBase.auth().currentUser.uid;
    const startLimit = route.params.limit[0];
    const endLimit = route.params.limit[1];
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
    const [modalTimeTable, setModalTimeTable] = useState(false);
    const [selectedDate, setSelectedDate] = useState(0);
    const [availTimeList, setAvailTimeList] = useState([]);
    const [alreadySetUp, setAlreadySetUp] = useState(false);
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
                .collection(uid)
                .doc(yearMonthStr)
                .get()
                .then((snapshot) => {
                    if (snapshot.exists) {
                        classDate = snapshot.data().class;
                    }
                });
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
                            ) &&
                        d <= //limit 20 days
                            new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                today.getDate() + 20
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

    useEffect(() => {
        const showTimeTable = async () => {
            setLoading(true);
            let finishSetUp = true;
            let timeList = [];
            const yearMonthStr =
                selectedYear +
                "-" +
                (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
            for (let i = Number(startLimit); i < Number(endLimit); i++) {
                let s =
                    (i < 10 ? "0" + i : i) +
                    ":00 ~ " +
                    (i + 1 < 10 ? "0" + (i + 1) : i + 1) +
                    ":00";
                let obj = {};
                obj["str"] = s;
                await db
                    .collection("classes")
                    .doc("pt")
                    .collection(uid)
                    .doc(yearMonthStr)
                    .collection(selectedDate.toString())
                    .doc(s)
                    .get()
                    .then((bool) => {
                        if (bool.exists) {
                            obj["submit"] = true;
                            obj["isAvail"] = bool.data().isAvail;
                            obj["hasReserve"] = bool.data().hasReservation;
                        } else {
                            obj["submit"] = false;
                            finishSetUp = false;
                        }
                    });
                timeList.push(obj);
            }
            setAvailTimeList(timeList);
            setAlreadySetUp(finishSetUp);
            if (finishSetUp) {
                await db
                    .collection("classes")
                    .doc("pt")
                    .collection(uid)
                    .doc(yearMonthStr)
                    .update({ class: arrayUnion(selectedDate.toString()) });
            }
            setLoading(false);
        };
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

    const setAvailableTime = async (availTime, i) => {
        const yearMonthStr =
            selectedYear +
            "-" +
            (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        await db
            .collection("classes")
            .doc("pt")
            .collection(uid)
            .doc(yearMonthStr)
            .collection(selectedDate.toString())
            .doc(availTime)
            .set({ isAvail: true, hasReservation: false });
        const backup = selectedDate;
        setSelectedDate(0);
        setSelectedDate(backup);
    };

    const setUnAvailabeTime = async (availTime, i) => {
        const yearMonthStr =
            selectedYear +
            "-" +
            (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        await db
            .collection("classes")
            .doc("pt")
            .collection(uid)
            .doc(yearMonthStr)
            .collection(selectedDate.toString())
            .doc(availTime)
            .set({ isAvail: false });
        const backup = selectedDate;
        setSelectedDate(0);
        setSelectedDate(backup);
    };

    const resetAvailTime = async (availTime) => {
        const yearMonthStr =
            selectedYear +
            "-" +
            (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        await db
            .collection("classes")
            .doc("pt")
            .collection(uid)
            .doc(yearMonthStr)
            .collection(selectedDate.toString())
            .doc(availTime)
            .delete();
        const backup = selectedDate;
        setSelectedDate(0);
        setSelectedDate(backup);
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
                        //justifyContent: "center",
                    }}
                >
                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            top:
                                Platform.OS === "ios"
                                    ? getStatusBarHeight()
                                    : 0,
                            left: 5,
                            margin: 10,
                            padding: 5,
                            zIndex: 1,
                        }}
                        onPress={() => {
                            if (alreadySetUp) {
                                setModalTimeTable(false);
                                setSelectedDate(0);
                                setChange(!change);
                            } else {
                                Alert.alert(
                                    "Warning",
                                    "You don't finish setting up time\nDo you want to go Back?",
                                    [
                                        { text: "Cancel" },
                                        {
                                            text: "OK",
                                            onPress: () => {
                                                setModalTimeTable(false);
                                                setSelectedDate(0);
                                            },
                                        },
                                    ]
                                );
                            }
                        }}
                    >
                        <Text style={{ fontSize: 17 }}>Close</Text>
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
                            fontSize: 20,
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
                                                fontSize: width / 25.5,
                                            }}
                                        >
                                            {availTime.str}
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
                                        }}
                                    >
                                        {availTime.submit === false ? (
                                            <>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.availButton,
                                                        {
                                                            marginRight: 7,
                                                            backgroundColor:
                                                                "#66ccff",
                                                        },
                                                    ]}
                                                    onPress={() =>
                                                        setAvailableTime(
                                                            availTime.str,
                                                            index
                                                        )
                                                    }
                                                >
                                                    <Text>Available</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.availButton,
                                                        {
                                                            marginLeft: 7,
                                                            backgroundColor:
                                                                "#ff9999",
                                                        },
                                                    ]}
                                                    onPress={() =>
                                                        setUnAvailabeTime(
                                                            availTime.str,
                                                            index
                                                        )
                                                    }
                                                >
                                                    <Text>Unavailable</Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <View
                                                style={{
                                                    flex: 1,
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                }}
                                            >
                                                {availTime.isAvail ? (
                                                    <View
                                                        style={{
                                                            flex: 3,
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        {availTime.hasReserve ? (
                                                            <Text>
                                                                Client 1
                                                            </Text>
                                                        ) : (
                                                            <Text>
                                                                No Reservation
                                                            </Text>
                                                        )}
                                                    </View>
                                                ) : (
                                                    <View
                                                        style={{
                                                            flex: 3,
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                color: "red",
                                                            }}
                                                        >
                                                            Unavailable
                                                        </Text>
                                                    </View>
                                                )}
                                                <TouchableOpacity
                                                    style={[
                                                        styles.availButton,
                                                        {
                                                            backgroundColor:
                                                                "white",
                                                            height: hp("7%"),
                                                        },
                                                    ]}
                                                    onPress={() =>
                                                        resetAvailTime(
                                                            availTime.str
                                                        )
                                                    }
                                                >
                                                    <Text>Reset</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
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
