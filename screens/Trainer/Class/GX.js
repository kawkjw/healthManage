import React, { useContext, useEffect, useRef, useState } from "react";
import { FlatList, View, TouchableOpacity, StyleSheet, Linking, ScrollView } from "react-native";
import myBase, { db } from "../../../config/MyBase";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import SegmentedPicker from "react-native-segmented-picker";
import { MaterialIcons } from "@expo/vector-icons";
import moment from "moment";
import { DataContext } from "../../Auth";
import { getHoliday } from "../../../config/hooks";
import { TextSize, theme } from "../../../css/MyStyles";
import Modal from "react-native-modal";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Text, ActivityIndicator, Button, Surface } from "react-native-paper";
import GxSeat from "../../../components/GxSeat";

export default GX = ({ navigation, route }) => {
    const uid = myBase.auth().currentUser.uid;
    const { classNames } = useContext(DataContext);
    const classNameList = route.params.className;
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
    const [classList, setClassList] = useState({});
    const [modalClassInfo, setModalClassInfo] = useState(false);
    const [loading, setLoading] = useState(true);
    const [modalClientInfo, setModalClientInfo] = useState(false);
    const [clientList, setClientList] = useState([]);
    const [isSpinning, setIsSpinning] = useState(false);

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
                .collection("users")
                .doc(uid)
                .collection("classes")
                .doc(yearMonthStr)
                .get()
                .then((snapshot) => {
                    if (snapshot.exists) {
                        if (snapshot.data().date !== undefined) {
                            classDate = snapshot.data().date;
                        }
                    }
                });
            classDate.sort();
            classDate.push("-1");
            let index = 0;
            const endDate = new Date(selectedYear, selectedMonth, 0);
            const holidayList = await getHoliday(selectedYear, selectedMonth);
            for (let i = 1; i <= endDate.getDate(); i++) {
                const d = new Date(yearMonthStr + "-" + (i < 10 ? "0" + i : i));
                let item = {
                    id: i.toString(),
                    pressable: true,
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

    const getMyClass = async () => {
        const yearMonthStr =
            selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        let allList = {};
        const exec = classNameList.map(async (className) => {
            if (classNames[className] !== undefined) {
                await db
                    .collection("users")
                    .doc(uid)
                    .collection("classes")
                    .doc(yearMonthStr)
                    .collection("date")
                    .doc(selectedDate.toString())
                    .get()
                    .then(async (doc) => {
                        let classId = [];
                        if (doc.exists) {
                            classId = doc.data().list;
                        }
                        return classId;
                    })
                    .then(async (classId) => {
                        let list = [];
                        const promises = classId.map(async (id) => {
                            const classForId = db
                                .collection("classes")
                                .doc(className)
                                .collection("class")
                                .doc(yearMonthStr)
                                .collection(selectedDate.toString())
                                .doc(id);
                            let classInfo = {};
                            classInfo["info"] = (await classForId.get()).data();
                            await classForId
                                .collection("clients")
                                .get()
                                .then(async (clients) => {
                                    let clientUids = [];
                                    let clientList = [];
                                    if (className === "spinning") {
                                        clients.forEach((client) => {
                                            clientUids.push({
                                                uid: client.data().uid,
                                                num: client.data().num,
                                            });
                                        });
                                        const clientPromise = clientUids.map(async (value) => {
                                            const { name, phoneNumber } = (
                                                await db.collection("users").doc(value.uid).get()
                                            ).data();
                                            clientList.push({ name, phoneNumber, num: value.num });
                                        });
                                        await Promise.all(clientPromise);
                                        clientList.sort((a, b) => {
                                            return a.num - b.num;
                                        });
                                    } else {
                                        clients.forEach((client) => {
                                            clientUids.push(client.data().uid);
                                        });
                                        const clientPromise = clientUids.map(async (uid) => {
                                            const { name, phoneNumber } = (
                                                await db.collection("users").doc(uid).get()
                                            ).data();
                                            clientList.push({ name, phoneNumber });
                                        });
                                        await Promise.all(clientPromise);
                                        clientList.sort((a, b) => {
                                            return a.name - b.name;
                                        });
                                    }

                                    classInfo["clients"] = clientList;
                                });
                            if (classInfo.info !== undefined) {
                                list.push(classInfo);
                            }
                        });
                        await Promise.all(promises);
                        list.sort((a, b) => {
                            return a.info.start.seconds - b.info.start.seconds;
                        });
                        allList[className] = list;
                    });
            }
        });
        await Promise.all(exec);
        return allList;
    };

    const setList = async () => {
        setLoading(true);
        await getMyClass().then((list) => {
            setClassList(list);
            setLoading(false);
        });
    };

    useEffect(() => {
        if (selectedDate !== 0) {
            setList();
        } else {
            setClassList({});
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
                                setModalClassInfo(item.pressable);
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
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
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
                isVisible={modalClassInfo}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => {
                    setModalClassInfo(false);
                    setSelectedDate(0);
                }}
                onBackButtonPress={() => {
                    setModalClassInfo(false);
                    setSelectedDate(0);
                }}
            >
                <View
                    style={{
                        height: hp("95%"),
                        backgroundColor: "white",
                    }}
                >
                    <View style={{ flexDirection: "row", backgroundColor: theme.colors.primary }}>
                        <Button
                            onPress={() => {
                                setModalClassInfo(false);
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
                        classNameList.map((className, index) => (
                            <View key={index} style={{ paddingLeft: 7, paddingTop: 10 }}>
                                <Text style={[TextSize.largeSize, { paddingLeft: 12 }]}>
                                    {classNames[className] !== undefined
                                        ? classNames[className].ko
                                        : "Error"}
                                </Text>
                                <FlatList
                                    data={classList[className]}
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
                                                style={styles.item}
                                                onPress={() => {
                                                    setClientList(item.clients);
                                                    setIsSpinning(className === "spinning");
                                                    setModalClientInfo(true);
                                                }}
                                            >
                                                <Text>
                                                    {moment(item.info.start.toDate()).format(
                                                        "HH:mm"
                                                    )}
                                                    ~
                                                    {moment(item.info.end.toDate()).format("HH:mm")}
                                                </Text>
                                                <Text>
                                                    {item.info.currentClient +
                                                        " / " +
                                                        item.info.maxClient}
                                                </Text>
                                            </TouchableOpacity>
                                        </Surface>
                                    )}
                                    numColumns={3}
                                    keyExtractor={(item, index) => index}
                                />
                            </View>
                        ))
                    )}
                </View>
                <Modal
                    isVisible={modalClientInfo}
                    style={{ justifyContent: "flex-end", margin: 0 }}
                    onBackdropPress={() => {
                        setModalClientInfo(false);
                        setIsSpinning(false);
                    }}
                    onBackButtonPress={() => {
                        setModalClientInfo(false);
                        setIsSpinning(false);
                    }}
                >
                    <View style={{ height: hp("90%"), backgroundColor: "white" }}>
                        <View
                            style={{ flexDirection: "row", backgroundColor: theme.colors.primary }}
                        >
                            <Button
                                onPress={() => {
                                    setModalClientInfo(false);
                                    setIsSpinning(false);
                                }}
                                labelStyle={[TextSize.largeSize, { color: "white" }]}
                            >
                                닫기
                            </Button>
                            <View
                                style={{ flex: 6, alignItems: "center", justifyContent: "center" }}
                            >
                                <Text style={[TextSize.largeSize, { color: "white" }]}>
                                    고객 명단
                                </Text>
                            </View>
                            <View style={{ flex: 1 }} />
                        </View>
                        <ScrollView style={{ paddingHorizontal: 10, marginTop: 10, flex: 1 }}>
                            {clientList.length === 0 ? (
                                <Text
                                    style={[
                                        TextSize.largeSize,
                                        {
                                            paddingLeft: 10,
                                            color: "red",
                                        },
                                    ]}
                                >
                                    예약한 고객이 없습니다.
                                </Text>
                            ) : (
                                clientList.map((client, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: "row",
                                            paddingHorizontal: 10,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flex: 1,
                                                alignItems: "flex-end",
                                            }}
                                        >
                                            <Text style={TextSize.normalSize}>
                                                {isSpinning
                                                    ? client.num + "번 "
                                                    : (index + 1).toString() + ". "}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                flex: 2,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text style={TextSize.normalSize}>{client.name}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={{ flex: 8 }}
                                            onPress={() =>
                                                Linking.openURL(`tel:${client.phoneNumber}`)
                                            }
                                        >
                                            <Text
                                                style={[
                                                    TextSize.normalSize,
                                                    {
                                                        color: "deepskyblue",
                                                    },
                                                ]}
                                            >
                                                {client.phoneNumber}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                            <View
                                style={{
                                    borderTopWidth: 1,
                                    borderTopColor: "grey",
                                    flex: 1,
                                    marginTop: 10,
                                }}
                            >
                                {isSpinning && <GxSeat permit="trainer" clientList={clientList} />}
                            </View>
                        </ScrollView>
                    </View>
                </Modal>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    item: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: wp("30%"),
        height: wp("30%"),
        backgroundColor: "white",
        borderRadius: 10,
    },
    day: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        height: wp("14%"),
        backgroundColor: "grey",
        borderRadius: 10,
    },
});
