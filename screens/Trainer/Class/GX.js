import React, { useContext, useEffect, useRef, useState } from "react";
import {
    Text,
    SafeAreaView,
    FlatList,
    View,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Platform,
    Image,
    Linking,
} from "react-native";
import myBase, { db } from "../../../config/MyBase";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import SegmentedPicker from "react-native-segmented-picker";
import { getStatusBarHeight } from "react-native-status-bar-height";
import { MaterialIcons } from "@expo/vector-icons";
import moment from "moment";
import { DataContext } from "../../Auth";
import { getHoliday } from "../../../config/hooks";
import { TextSize } from "../../../css/MyStyles";

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
                        classDate = snapshot.data().date;
                    }
                });
            classDate.sort();
            classDate.push("-1");
            let index = 0;
            const endDate = new Date(selectedYear, selectedMonth, 0);
            const holidayList = await getHoliday(selectedYear, selectedMonth);
            for (let i = 1; i <= endDate.getDate(); i++) {
                const d = new Date(yearMonthStr + "-" + (i < 10 ? "0" + i : i));
                let item = { id: i.toString(), pressable: true };
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
                        let classId = doc.data().list;
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
                                    clients.forEach((client) => {
                                        clientUids.push(client.data().uid);
                                    });
                                    let clientList = [];
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
                        <MaterialIcons name="chevron-left" size={30} color="black" />
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
                        <Text style={TextSize.largeSize}>
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
                        <MaterialIcons name="chevron-right" size={30} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
            <FlatList
                data={data}
                windowSize={1}
                renderItem={({ item }) => (
                    <View style={{ flex: 1, flexDirection: "column", margin: 5 }}>
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
                        </TouchableOpacity>
                    </View>
                )}
                numColumns={7}
                keyExtractor={(item, index) => index}
                scrollEnabled={false}
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
            <Modal animationType="fade" visible={modalClassInfo} transparent={true}>
                <SafeAreaView
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                    }}
                >
                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            top: Platform.OS === "ios" ? getStatusBarHeight() : 0,
                            left: 0,
                            margin: 10,
                            padding: 5,
                            zIndex: 1,
                        }}
                        onPress={() => {
                            setModalClassInfo(false);
                            setSelectedDate(0);
                            setLoading(true);
                        }}
                    >
                        <Text style={TextSize.normalSize}>닫기</Text>
                    </TouchableOpacity>
                    <View
                        style={{
                            height: 40,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text style={TextSize.largeSize}>{selectedDate + "일"}</Text>
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
                        classNameList.map((className, index) => (
                            <View key={index} style={{ paddingLeft: 7, paddingTop: 10 }}>
                                <Text style={{ paddingLeft: 12 }}>
                                    {classNames[className] !== undefined
                                        ? classNames[className].ko
                                        : "Error"}
                                </Text>
                                <FlatList
                                    data={classList[className]}
                                    renderItem={({ item }) => (
                                        <View
                                            style={{
                                                flexDirection: "column",
                                                margin: 5,
                                            }}
                                        >
                                            <TouchableOpacity
                                                style={styles.item}
                                                onPress={() => {
                                                    setClientList(item.clients);
                                                    setModalClassInfo(false);
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
                                        </View>
                                    )}
                                    numColumns={3}
                                    keyExtractor={(item, index) => index}
                                />
                            </View>
                        ))
                    )}
                </SafeAreaView>
            </Modal>
            <Modal animationType="fade" visible={modalClientInfo} transparent={true}>
                <SafeAreaView
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                    }}
                >
                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            top: Platform.OS === "ios" ? getStatusBarHeight() : 0,
                            left: 0,
                            margin: 10,
                            padding: 5,
                            zIndex: 1,
                        }}
                        onPress={() => {
                            setModalClientInfo(false);
                            setSelectedDate(0);
                            setLoading(true);
                        }}
                    >
                        <Text style={TextSize.normalSize}>닫기</Text>
                    </TouchableOpacity>
                    <View style={{ height: 50 }}></View>
                    <View style={{ paddingHorizontal: 10 }}>
                        <Text
                            style={[
                                TextSize.largerSize,
                                {
                                    marginBottom: 5,
                                },
                            ]}
                        >
                            고객 명단
                        </Text>
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
                                        paddingLeft: 10,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: wp("4%"),
                                            alignItems: "flex-end",
                                        }}
                                    >
                                        <Text style={TextSize.normalSize}>
                                            {(index + 1).toString() + ". "}
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            width: wp("15%"),
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={TextSize.normalSize}>{client.name}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(`tel:${client.phoneNumber}`)}
                                    >
                                        <Text
                                            style={[
                                                TextSize.normalSize,
                                                {
                                                    color: "blue",
                                                },
                                            ]}
                                        >
                                            {client.phoneNumber}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
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
        borderWidth: 1,
        borderRadius: 10,
    },
    day: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        height: wp("14%"),
        backgroundColor: "grey",
        borderWidth: 1,
        borderRadius: 10,
    },
});
