import React, { useContext, useEffect, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import SegmentedPicker from "react-native-segmented-picker";
import { MaterialIcons } from "@expo/vector-icons";
import myBase, { db } from "../../../config/MyBase";
import TimeTable from "../../../config/TimeTable";
import { DataContext } from "../../Auth";
import { getHoliday } from "../../../config/hooks";
import { TextSize } from "../../../css/MyStyles";
import Modal from "react-native-modal";
import { RFPercentage } from "react-native-responsive-fontsize";

export default ClassInfo = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const uid = myBase.auth().currentUser.uid;
    const { classNames } = useContext(DataContext);
    const { ptName } = route.params;
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
            let ptUidList = [];
            await db
                .collection("classes")
                .doc(ptName)
                .get()
                .then((doc) => {
                    ptUidList = doc.data().trainerList;
                });
            setPtUid(ptUidList);
            const ptPromises = ptUidList.map(async (tUid) => {
                await db
                    .collection("classes")
                    .doc(ptName)
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
                selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
            let dataList = [];
            const promisesForUid = ptUid.map(async (uid) => {
                let temp = {};
                const { name } = (await db.collection("users").doc(uid).get()).data();
                temp["name"] = name;
                await db
                    .collection("classes")
                    .doc(ptName)
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
                                    await db.collection("users").doc(v.clientUid).get()
                                ).data();
                                let count = 0;
                                await db
                                    .collection("users")
                                    .doc(v.clientUid)
                                    .collection("memberships")
                                    .doc("list")
                                    .collection(ptName === "pt" ? ptName : ptName + "pt")
                                    .where("count", ">", 0)
                                    .get()
                                    .then((ptDocs) => {
                                        if (ptDocs.size === 0) {
                                            count = -1;
                                        } else {
                                            ptDocs.forEach((doc) => {
                                                count = count + doc.data().count;
                                            });
                                        }
                                    });
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
        <SafeAreaView style={{ flex: 1 }}>
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
                onBackdropPress={() => setModalClassInfo(false)}
                onBackButtonPress={() => setModalClassInfo(false)}
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
                                setModalClassInfo(false);
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
                        <TimeTable kind="pt" classData={classData} nameList={classNames} />
                    )}
                </View>
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
});
