import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Text,
    SafeAreaView,
    FlatList,
    View,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import myBase, { db } from "../../../config/MyBase";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import SegmentedPicker from "react-native-segmented-picker";

export default GX = ({ navigation, route }) => {
    const uid = myBase.auth().currentUser.uid;
    const classList = route.params.className;
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
                    <TouchableOpacity activeOpacity={0} onPress={goPreMonth}>
                        <Text style={{ fontSize: 17 }}>pre</Text>
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
                    <TouchableOpacity activeOpacity={0} onPress={goNextMonth}>
                        <Text style={{ fontSize: 17 }}>next</Text>
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
                                //setModalClass(item.pressable);
                                //setSelectDate(Number(item.id));
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
                    console.log(select);
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
