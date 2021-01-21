import React, { useEffect, useRef, useState } from "react";
import {
    Text,
    SafeAreaView,
    FlatList,
    View,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    Platform,
    Dimensions,
    Image,
    Linking,
} from "react-native";
import myBase, { db } from "../../../config/MyBase";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import SegmentedPicker from "react-native-segmented-picker";
import { getStatusBarHeight } from "react-native-status-bar-height";
import { MaterialIcons } from "@expo/vector-icons";

export default GX = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const uid = myBase.auth().currentUser.uid;
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

    const enToKo = (s) => {
        switch (s) {
            case "health":
                return "헬스";
            case "spinning":
                return "스피닝";
            case "yoga":
                return "요가";
            case "zoomba":
                return "줌바";
            case "squash":
                return "스쿼시";
            case "pilates":
                return "필라테스";
            case "pt":
                return "PT";
        }
    };

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
            classDate.push("-1");
            let index = 0;
            const endDate = new Date(selectedYear, selectedMonth, 0);
            for (let i = 1; i <= endDate.getDate(); i++) {
                const d = new Date(yearMonthStr + "-" + (i < 10 ? "0" + i : i));
                let item = { id: i.toString(), pressable: true };
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

    const getMyClass = async () => {
        const yearMonthStr =
            selectedYear +
            "-" +
            (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        let allList = {};
        await classNameList.forEach(async (className) => {
            let list = [];
            await db
                .collection("users")
                .doc(uid)
                .collection("classes")
                .doc(yearMonthStr)
                .collection("date")
                .doc(selectedDate.toString())
                .get()
                .then((doc) => {
                    let classId = [];
                    switch (className) {
                        case "pilates":
                            classId = doc.data().pilates;
                            break;
                        case "spinning":
                            classId = doc.data().spinning;
                            break;
                        case "squash":
                            classId = doc.data().squash;
                            break;
                        case "yoga":
                            classId = doc.data().yoga;
                            break;
                        case "zoomba":
                            classId = doc.data().zoomba;
                            break;
                        default:
                            Alert.alert("Error", "Wrong Class Name");
                    }
                    classId.forEach(async (id) => {
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
                            .then((clients) => {
                                let clientList = [];
                                clients.forEach((client) => {
                                    clientList.push(client.data());
                                });
                                classInfo["clients"] = clientList;
                            });
                        list.push(classInfo);
                        list.sort((a, b) => {
                            return a.info.start.seconds - b.info.start.seconds;
                        });
                    });
                });
            allList[className] = list;
        });
        setTimeout(() => {
            setClassList(allList);
            setLoading(false);
        }, 2500);
    };

    useEffect(() => {
        if (selectedDate !== 0) {
            getMyClass();
        } else {
            setClassList({});
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
                visible={modalClassInfo}
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
                            setModalClassInfo(false);
                            setSelectedDate(0);
                            setLoading(true);
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
                        classNameList.map((className, index) => (
                            <View
                                key={index}
                                style={{ paddingLeft: 7, paddingTop: 10 }}
                            >
                                <Text style={{ paddingLeft: 12 }}>
                                    {enToKo(className)}
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
                                                    {(item.info.start
                                                        .toDate()
                                                        .getHours() < 10
                                                        ? "0" +
                                                          item.info.start
                                                              .toDate()
                                                              .getHours()
                                                        : item.info.start
                                                              .toDate()
                                                              .getHours()) +
                                                        ":" +
                                                        (item.info.start
                                                            .toDate()
                                                            .getMinutes() === 0
                                                            ? "00"
                                                            : item.info.start
                                                                  .toDate()
                                                                  .getMinutes())}
                                                    ~
                                                    {(item.info.end
                                                        .toDate()
                                                        .getHours() < 10
                                                        ? "0" +
                                                          item.info.end
                                                              .toDate()
                                                              .getHours()
                                                        : item.info.end
                                                              .toDate()
                                                              .getHours()) +
                                                        ":" +
                                                        (item.info.end
                                                            .toDate()
                                                            .getMinutes() === 0
                                                            ? "00"
                                                            : item.info.end
                                                                  .toDate()
                                                                  .getMinutes())}
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
            <Modal
                animationType="slide"
                visible={modalClientInfo}
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
                            setModalClientInfo(false);
                            setSelectedDate(0);
                            setLoading(true);
                        }}
                    >
                        <Text style={{ fontSize: 17 }}>Close</Text>
                    </TouchableOpacity>
                    <View style={{ height: 50 }}></View>
                    <View style={{ paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 25 }}>Client List</Text>
                        {clientList.map((client, index) => (
                            <View key={index} style={{ flexDirection: "row" }}>
                                <Text style={{ flex: 1, fontSize: 17 }}>
                                    {client.name}
                                </Text>
                                <TouchableOpacity
                                    style={{ flex: 5 }}
                                    onPress={() =>
                                        Linking.openURL(
                                            `tel:${client.phoneNumber}`
                                        )
                                    }
                                >
                                    <Text
                                        style={{ color: "blue", fontSize: 17 }}
                                    >
                                        {client.phoneNumber}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}
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
