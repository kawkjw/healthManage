import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import SegmentedPicker from "react-native-segmented-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { getStatusBarHeight } from "react-native-status-bar-height";
import myBase, { db } from "../../../config/MyBase";
import TimeTable from "../../../config/TimeTable";

export default ClassInfo = ({ navigation }) => {
    const { width } = Dimensions.get("screen");
    const uid = myBase.auth().currentUser.uid;
    const today = new Date();
    const [loading, setLoading] = useState(true);
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
    const [modalClassInfo, setModalClassInfo] = useState(false);
    const [selectedDate, setSelectedDate] = useState(0);
    const [ptUid, setPtUid] = useState([]);
    const [classData, setClassData] = useState([]);
    const [loadingInModal, setLoadingInModal] = useState(true);

    useEffect(() => {
        const showCalendar = async () => {
            setLoading(true);
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
            let ptUidList = [];
            await db
                .collection("users")
                .where("permission", "==", 1)
                .get()
                .then((trainers) => {
                    trainers.forEach((trainer) => {
                        if (trainer.data().className.split(".")[0] === "pt") {
                            ptUidList.push(trainer.data().uid);
                        }
                    });
                });
            setPtUid(ptUidList);
            const ptPromises = ptUidList.map(async (tUid) => {
                await db
                    .collection("classes")
                    .doc("pt")
                    .collection(tUid)
                    .doc(yearMonthStr)
                    .get()
                    .then((doc) => {
                        doc.data().hasClass.forEach((date) => {
                            if (classDate.indexOf(date) === -1) {
                                classDate.push(date);
                            }
                        });
                    })
                    .catch((error) => {});
            });
            await Promise.all(ptPromises);
            classDate.sort();
            classDate.push("-1");
            let index = 0;
            const endDate = new Date(selectedYear, selectedMonth, 0);
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
            setLoading(false);
        };
        showCalendar();
    }, [change]);

    useEffect(() => {
        const getClassData = async () => {
            setLoadingInModal(true);
            const yearMonthStr =
                selectedYear +
                "-" +
                (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
            let dataList = [];
            const promisesForUid = ptUid.map(async (uid) => {
                let temp = {};
                const { name } = (
                    await db.collection("users").doc(uid).get()
                ).data();
                temp["name"] = name;
                await db
                    .collection("classes")
                    .doc("pt")
                    .collection(uid)
                    .doc(yearMonthStr)
                    .collection(selectedDate.toString())
                    .where("confirm", "==", true)
                    .get()
                    .then((snapshots) => {
                        let list = [];
                        snapshots.forEach((snapshot) => {
                            let obj = {};
                            obj["start"] = Number(snapshot.id.split(":")[0]);
                            obj["clientUid"] = snapshot.data().clientUid;
                            list.push(obj);
                        });
                        list.push(-1);
                        return list;
                    })
                    .then(async (list) => {
                        let changed = list;
                        const promises = list.map(async (v, index) => {
                            if (v !== -1) {
                                const { name } = (
                                    await db
                                        .collection("users")
                                        .doc(v.clientUid)
                                        .get()
                                ).data();
                                const { count } = (
                                    await db
                                        .collection("users")
                                        .doc(v.clientUid)
                                        .collection("memberships")
                                        .doc("pt")
                                        .get()
                                ).data();
                                changed[index]["clientName"] = name;
                                changed[index]["remainCount"] = count;
                            }
                        });
                        await Promise.all(promises);
                        temp["classes"] = changed;
                    });
                dataList.push(temp);
            });
            await Promise.all(promisesForUid);
            setClassData(dataList);
            setLoadingInModal(false);
        };
        if (selectedDate !== 0) {
            getClassData();
        }
    }, [selectedDate]);

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
        <SafeAreaView style={{ flex: 1 }}>
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
                        <Text style={{ fontSize: RFPercentage(2.5) }}>
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
                <FlatList
                    data={data}
                    windowSize={1}
                    renderItem={({ item }) => (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: "column",
                                margin: 5,
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
            )}
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
                            setModalClassInfo(false);
                            setSelectedDate(0);
                        }}
                    >
                        <Text style={{ fontSize: RFPercentage(2) }}>Close</Text>
                    </TouchableOpacity>
                    <View
                        style={{
                            height: 30,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text style={{ fontSize: RFPercentage(2.5) }}>
                            {selectedDate + "일"}
                        </Text>
                    </View>
                    {loadingInModal ? (
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
                        <TimeTable
                            kind="pt"
                            classData={classData}
                            style={{ marginTop: 10 }}
                        />
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
        borderRadius: RFPercentage(2.5),
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