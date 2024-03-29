import React, { useContext, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { getHoliday, priceToString } from "../../config/hooks";
import SegmentedPicker from "react-native-segmented-picker";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { BarChart, XAxis, YAxis, Grid } from "react-native-svg-charts";
import { Text as SvgText } from "react-native-svg";
import { db } from "../../config/MyBase";
import { TextSize, theme } from "../../css/MyStyles";
import { DataContext } from "../Auth";
import { Text, ActivityIndicator, Surface } from "react-native-paper";
import Animated, { EasingNode } from "react-native-reanimated";

export default Sales = ({ navigation, route }) => {
    const today = new Date();
    const { classNames } = useContext(DataContext);
    const [menu, setMenu] = useState(0);
    const [loading, setLoading] = useState(false);
    const [dateChange, setDateChange] = useState(true);

    const [data, setData] = useState([]);
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
    const [dayAnimation] = useState(new Animated.Value(hp("70%")));
    const [dayInfoAnimation] = useState(new Animated.Value(0));
    const [dayBackAnimation] = useState(new Animated.Value(0));
    const [dayMoveAnimation] = useState(new Animated.Value(100));
    const [dayCash, setDayCash] = useState(0);
    const [dayCard, setDayCard] = useState(0);

    const [monthYear, setMonthYear] = useState(today.getFullYear());
    const [monthMonth, setMonthMonth] = useState(0);
    const [monthData, setMonthData] = useState([]);
    const [monthAnimation] = useState(new Animated.Value(hp("32%")));
    const [monthInfoAnimation] = useState(new Animated.Value(0));
    const [monthBackAnimation] = useState(new Animated.Value(0));
    const [monthMoveAnimation] = useState(new Animated.Value(100));
    const [monthCash, setMonthCash] = useState(0);
    const [monthCard, setMonthCard] = useState(0);

    const [statsYear, setStatsYear] = useState(today.getFullYear());
    const [statsMonth, setStatsMonth] = useState(0);
    const [statsAnimation] = useState(new Animated.Value(hp("32%")));
    const [statsInfoAnimation] = useState(new Animated.Value(0));
    const [statsBackAnimation] = useState(new Animated.Value(0));
    const [statsMoveAnimation] = useState(new Animated.Value(100));
    const [statsData, setStatsData] = useState({});

    const [chart, setChart] = useState([]);
    const [maxPrice, setMaxPrice] = useState(0);
    const [label, setLabel] = useState([
        "Test 1",
        "Test 2",
        "Test 3",
        "Test 4",
        "Test 5",
        "Test 6",
    ]);

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
                items.push({ id: " ", pressable: false, isBlank: true });
            }

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
                items.push(item);
            }
            for (let i = 0; i < 6 - endDate.getDay(); i++) {
                items.push({ id: " ", pressable: false, isBlank: true });
            }
            setData(items);
        };
        showCalendar();
    }, [dateChange]);

    useEffect(() => {
        const setListForPicker = () => {
            let list = [];
            for (let i = today.getFullYear() - 20; i <= today.getFullYear(); i++) {
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
        const setListForMonth = () => {
            let items = [];
            for (let i = 1; i <= 12; i++) {
                items.push({ id: i });
            }
            setMonthData(items);
        };
        setListForPicker();
        setListForMonth();
    }, []);

    const getSales = async (kind, year, month, date = 0) => {
        let min = { month: 0, date: 0 };
        let max = { month: 0, date: 0 };
        if (kind === "day") {
            min = { month: month - 1, date: date };
            max = { month: month - 1, date: date + 1 };
        } else if (kind === "month") {
            min = { month: month - 1, date: 1 };
            max = { month: month, date: 1 };
        }
        const minDate = new Date(year, min.month, min.date);
        const maxDate = new Date(year, max.month, max.date);
        let cash = 0;
        let card = 0;
        setLoading(true);
        await db
            .collectionGroup("memberships")
            .get()
            .then((docs) => {
                let list = [];
                docs.forEach((doc) => {
                    if (doc.data().classes !== undefined) {
                        let obj = {};
                        obj["path"] = doc.ref.path;
                        obj["classes"] = doc.data().classes;
                        list.push(obj);
                    }
                });
                return list;
            })
            .then(async (list) => {
                const rootPromises = list.map(async (obj) => {
                    const promises = obj.classes.map(async (name) => {
                        await db
                            .doc(obj.path)
                            .collection(name)
                            .where("payDay", ">", minDate)
                            .where("payDay", "<", maxDate)
                            .get()
                            .then((docs) => {
                                docs.forEach((doc) => {
                                    if (
                                        doc.data().payKind !== undefined &&
                                        doc.data().price !== undefined
                                    ) {
                                        const { payKind, price } = doc.data();
                                        if (payKind === "cash") {
                                            cash = cash + Number(price);
                                        } else if (payKind === "card") {
                                            card = card + Number(price);
                                        }
                                    }
                                });
                            });
                    });
                    await Promise.all(promises);
                });
                await Promise.all(rootPromises);
            })
            .then(async () => {
                await db
                    .collectionGroup("locker")
                    .where("payDay", ">", minDate)
                    .where("payDay", "<", maxDate)
                    .get()
                    .then((docs) => {
                        docs.forEach((doc) => {
                            if (
                                doc.data().payKind !== undefined &&
                                doc.data().price !== undefined
                            ) {
                                const { payKind, price } = doc.data();
                                if (payKind === "cash") {
                                    cash = cash + Number(price);
                                } else if (payKind === "card") {
                                    card = card + Number(price);
                                }
                            }
                        });
                    });
            })
            .then(async () => {
                await db
                    .collectionGroup("clothes")
                    .where("payDay", ">", minDate)
                    .where("payDay", "<", maxDate)
                    .get()
                    .then((docs) => {
                        docs.forEach((doc) => {
                            if (
                                doc.data().payKind !== undefined &&
                                doc.data().price !== undefined
                            ) {
                                const { payKind, price } = doc.data();
                                if (payKind === "cash") {
                                    cash = cash + Number(price);
                                } else if (payKind === "card") {
                                    card = card + Number(price);
                                }
                            }
                        });
                    });
            })
            .then(() => {
                if (kind === "day") {
                    setDayCash(cash);
                    setDayCard(card);
                } else if (kind === "month") {
                    setMonthCash(cash);
                    setMonthCard(card);
                }
            });
        setLoading(false);
    };

    const getStats = async () => {
        let keys = [];
        for (const [key, value] of Object.entries(classNames)) {
            if (value.month !== undefined || value.count !== undefined) {
                if (value.minien !== undefined) {
                    if (keys.indexOf(value.minien) === -1) keys.push(value.minien);
                } else {
                    if (keys.indexOf(key) === -1) keys.push(key);
                }
            }
        }
        const koLabel = keys.map((key) => classNames[key].ko);
        setLabel(koLabel);
        setLoading(true);
        await db
            .collectionGroup("memberships")
            .get()
            .then((docs) => {
                let list = [];
                docs.forEach((doc) => {
                    if (doc.data().classes !== undefined) {
                        let obj = {};
                        obj["path"] = doc.ref.path;
                        obj["classes"] = doc.data().classes;
                        list.push(obj);
                    }
                });
                return list;
            })
            .then(async (list) => {
                let temp = {};
                const rootPromises = list.map(async (obj) => {
                    const promises = obj.classes.map(async (name) => {
                        const minDate = new Date(statsYear, statsMonth - 1, 1);
                        const maxDate = new Date(statsYear, statsMonth, 1);
                        await db
                            .doc(obj.path)
                            .collection(name)
                            .where("payDay", ">", minDate)
                            .where("payDay", "<", maxDate)
                            .get()
                            .then((docs) => {
                                docs.forEach((doc) => {
                                    if (
                                        doc.data().payKind !== undefined &&
                                        doc.data().price !== undefined
                                    ) {
                                        const { price } = doc.data();
                                        const name = classNames[doc.ref.parent.id].minien;
                                        if (temp[name] === undefined) {
                                            temp[name] = { price: Number(price), num: 1 };
                                        } else {
                                            temp[name].price += Number(price);
                                            temp[name].num += 1;
                                        }
                                    }
                                });
                            });
                    });
                    await Promise.all(promises);
                });
                await Promise.all(rootPromises);
                let obj = {};
                let chart = [];
                keys.forEach((key) => {
                    if (temp[key] === undefined) {
                        obj[key] = { price: 0, num: 0 };
                        chart.push(0);
                    } else {
                        obj[key] = temp[key];
                        chart.push(temp[key].price);
                    }
                });
                setMaxPrice(
                    chart.reduce((pre, cur) => {
                        return pre > cur ? pre : cur;
                    })
                );
                setStatsData(obj);
                setChart(chart);
            });
        setLoading(false);
    };

    useEffect(() => {
        if (selectedDate !== 0) getSales("day", selectedYear, selectedMonth, selectedDate);
    }, [selectedDate]);

    useEffect(() => {
        if (monthMonth !== 0) getSales("month", monthYear, monthMonth);
    }, [monthMonth]);

    useEffect(() => {
        if (statsMonth !== 0) getStats();
    }, [statsMonth]);

    const goPreMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(selectedYear - 1);
            setSelections({ year: (selectedYear - 1).toString(), month: "12" });
        } else {
            setSelectedMonth(selectedMonth - 1);
            setSelections({ year: selectedYear.toString(), month: (selectedMonth - 1).toString() });
        }
        setDateChange(!dateChange);
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
        setDateChange(!dateChange);
    };

    const onSelectDay = () => {
        const hideCalendar = Animated.timing(dayAnimation, {
            toValue: 0,
            duration: 400,
            easing: EasingNode.ease,
        });
        const showInfo = Animated.timing(dayInfoAnimation, {
            toValue: 1,
            duration: 400,
            easing: EasingNode.ease,
        });
        const showBack = Animated.timing(dayBackAnimation, {
            toValue: 1,
            duration: 800,
            easing: EasingNode.ease,
        });
        const moveBack = Animated.timing(dayMoveAnimation, {
            toValue: 0,
            duration: 450,
            easing: EasingNode.ease,
        });

        Animated.block([
            hideCalendar.start(),
            showInfo.start(),
            showBack.start(),
            moveBack.start(),
        ]);
    };

    const onSelectDayMenu = () => {
        const showCalendar = Animated.timing(dayAnimation, {
            toValue: hp("70%"),
            duration: 500,
            easing: EasingNode.ease,
        });
        const hideInfo = Animated.timing(dayInfoAnimation, {
            toValue: 0,
            duration: 500,
            easing: EasingNode.ease,
        });
        const hideBack = Animated.timing(dayBackAnimation, {
            toValue: 0,
            duration: 400,
            easing: EasingNode.ease,
        });
        const moveBack = Animated.timing(dayMoveAnimation, {
            toValue: 100,
            duration: 500,
            easing: EasingNode.ease,
        });

        Animated.block([
            showCalendar.start(),
            hideInfo.start(),
            hideBack.start(),
            moveBack.start(),
        ]);
    };

    const onSelectMonth = () => {
        const hideCalendar = Animated.timing(monthAnimation, {
            toValue: 0,
            duration: 400,
            easing: EasingNode.ease,
        });
        const showInfo = Animated.timing(monthInfoAnimation, {
            toValue: 1,
            duration: 400,
            easing: EasingNode.ease,
        });
        const showBack = Animated.timing(monthBackAnimation, {
            toValue: 1,
            duration: 800,
            easing: EasingNode.ease,
        });
        const moveBack = Animated.timing(monthMoveAnimation, {
            toValue: 0,
            duration: 450,
            easing: EasingNode.ease,
        });

        Animated.block([
            hideCalendar.start(),
            showInfo.start(),
            showBack.start(),
            moveBack.start(),
        ]);
    };

    const onSelectMonthMenu = () => {
        const showCalendar = Animated.timing(monthAnimation, {
            toValue: hp("32%"),
            duration: 400,
            easing: EasingNode.ease,
        });
        const hideInfo = Animated.timing(monthInfoAnimation, {
            toValue: 0,
            duration: 400,
            easing: EasingNode.ease,
        });
        const hideBack = Animated.timing(monthBackAnimation, {
            toValue: 0,
            duration: 400,
            easing: EasingNode.ease,
        });
        const moveBack = Animated.timing(monthMoveAnimation, {
            toValue: 100,
            duration: 500,
            easing: EasingNode.ease,
        });

        Animated.block([
            showCalendar.start(),
            hideInfo.start(),
            hideBack.start(),
            moveBack.start(),
        ]);
    };

    const onSelectStats = () => {
        const hideCalendar = Animated.timing(statsAnimation, {
            toValue: 0,
            duration: 400,
            easing: EasingNode.ease,
        });
        const showInfo = Animated.timing(statsInfoAnimation, {
            toValue: 1,
            duration: 400,
            easing: EasingNode.ease,
        });
        const showBack = Animated.timing(statsBackAnimation, {
            toValue: 1,
            duration: 800,
            easing: EasingNode.ease,
        });
        const moveBack = Animated.timing(statsMoveAnimation, {
            toValue: 0,
            duration: 450,
            easing: EasingNode.ease,
        });

        Animated.block([
            hideCalendar.start(),
            showInfo.start(),
            showBack.start(),
            moveBack.start(),
        ]);
    };

    const onSelectStatsMenu = () => {
        const showCalendar = Animated.timing(statsAnimation, {
            toValue: hp("32%"),
            duration: 400,
            easing: EasingNode.ease,
        });
        const hideInfo = Animated.timing(statsInfoAnimation, {
            toValue: 0,
            duration: 400,
            easing: EasingNode.ease,
        });
        const hideBack = Animated.timing(statsBackAnimation, {
            toValue: 0,
            duration: 400,
            easing: EasingNode.ease,
        });
        const moveBack = Animated.timing(statsMoveAnimation, {
            toValue: 100,
            duration: 500,
            easing: EasingNode.ease,
        });

        Animated.block([
            showCalendar.start(),
            hideInfo.start(),
            hideBack.start(),
            moveBack.start(),
        ]);
    };

    const Labels = ({ x, y, bandwidth, data }) =>
        data.map((value, index) => (
            <SvgText
                key={index}
                x={x(index) + bandwidth / 2}
                y={value < Math.floor(maxPrice / 2) ? y(value) - 10 : y(value) + 15}
                fontSize={RFPercentage(1.9)}
                fill={value >= Math.floor(maxPrice / 2) ? "white" : "black"}
                alignmentBaseline={"middle"}
                textAnchor={"middle"}
            >
                {Number(value) >= 10000
                    ? Number(value)
                          .toString()
                          .substr(0, Number(value).toString().length - 4) + "만"
                    : Number(value) !== 0
                    ? Number(value).toString()
                    : 0}
            </SvgText>
        ));

    const renderStats = () => {
        let render = [];
        let index = 0;
        let sum = 0;
        for (const [key, value] of Object.entries(statsData)) {
            const temp = (
                <View key={index} style={{ flexDirection: "row" }}>
                    <Text style={[TextSize.normalSize, { flex: 1, textAlign: "right" }]}>
                        {classNames[key].ko + ":"}
                    </Text>
                    <Text style={[TextSize.normalSize, { flex: 5, paddingLeft: 3 }]}>
                        {priceToString(value.price)}원
                    </Text>
                </View>
            );
            index += 1;
            sum += value.price;
            render.push(temp);
        }
        render.push(
            <View key={index} style={{ flexDirection: "row" }}>
                <Text style={[TextSize.normalSize, { flex: 1, textAlign: "right" }]}>
                    {"합계:"}
                </Text>
                <Text style={[TextSize.normalSize, { flex: 5, paddingLeft: 3 }]}>
                    {priceToString(sum)}원
                </Text>
            </View>
        );
        return render;
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row" }}>
                    <Surface style={styles.surface}>
                        <TouchableOpacity style={styles.alignCenter} onPress={() => setMenu(0)}>
                            <View style={menu === 0 ? { borderBottomWidth: 1 } : undefined}>
                                <Text style={styles.menuText}>일간</Text>
                            </View>
                        </TouchableOpacity>
                    </Surface>
                    <Surface style={styles.surface}>
                        <TouchableOpacity style={styles.alignCenter} onPress={() => setMenu(1)}>
                            <View style={menu === 1 ? { borderBottomWidth: 1 } : undefined}>
                                <Text style={styles.menuText}>월간</Text>
                            </View>
                        </TouchableOpacity>
                    </Surface>
                    <Surface style={styles.surface}>
                        <TouchableOpacity style={styles.alignCenter} onPress={() => setMenu(2)}>
                            <View style={menu === 2 ? { borderBottomWidth: 1 } : undefined}>
                                <Text style={styles.menuText}>통계</Text>
                            </View>
                        </TouchableOpacity>
                    </Surface>
                </View>
                <SegmentedPicker
                    ref={picker}
                    onConfirm={(select) => {
                        setSelections(select);
                        setSelectedYear(Number(select.year));
                        setSelectedMonth(Number(select.month));
                        setDateChange(!dateChange);
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

                {menu === 0 && (
                    <>
                        <View>
                            <Animated.View style={{ height: dayAnimation }}>
                                <View style={{ flexDirection: "row" }}>
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
                                            <Text style={TextSize.largerSize}>
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
                                                    item.isBlank
                                                        ? { backgroundColor: "#b3b3b3" }
                                                        : undefined,
                                                ]}
                                                onPress={() => {
                                                    onSelectDay();
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
                            </Animated.View>
                            <Animated.View
                                style={{
                                    opacity: dayInfoAnimation,
                                }}
                            >
                                <View style={{ backgroundColor: "white", padding: 10 }}>
                                    <Text style={TextSize.largeSize}>
                                        {moment(
                                            `${selectedYear} ${selectedMonth} ${selectedDate}`,
                                            "YYYY M D"
                                        ).format("YYYY년 MM월 DD일 결산")}
                                    </Text>
                                    {loading ? (
                                        <View
                                            style={{
                                                width: wp("100%"),
                                                height: hp("50%"),
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: "white",
                                            }}
                                        >
                                            <ActivityIndicator
                                                animating={true}
                                                size="large"
                                                color="black"
                                            />
                                        </View>
                                    ) : (
                                        <View>
                                            <View style={{ flexDirection: "row" }}>
                                                <Text
                                                    style={[
                                                        TextSize.normalSize,
                                                        { flex: 1, textAlign: "right" },
                                                    ]}
                                                >
                                                    현금 총액:
                                                </Text>
                                                <Text style={[TextSize.normalSize, { flex: 5 }]}>
                                                    {" " + priceToString(dayCash)}원
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row" }}>
                                                <Text
                                                    style={[
                                                        TextSize.normalSize,
                                                        { flex: 1, textAlign: "right" },
                                                    ]}
                                                >
                                                    카드 총액:
                                                </Text>
                                                <Text style={[TextSize.normalSize, { flex: 5 }]}>
                                                    {" " + priceToString(dayCard)}원
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row" }}>
                                                <Text
                                                    style={[
                                                        TextSize.normalSize,
                                                        { flex: 1, textAlign: "right" },
                                                    ]}
                                                >
                                                    합계:
                                                </Text>
                                                <Text style={[TextSize.normalSize, { flex: 5 }]}>
                                                    {" " + priceToString(dayCash + dayCard)}원
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </Animated.View>
                        </View>
                        <Animated.View
                            style={{
                                position: "absolute",
                                right: 10,
                                bottom: 10,
                                opacity: dayBackAnimation,
                                transform: [{ translateY: dayMoveAnimation }],
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    onSelectDayMenu();
                                }}
                                disabled={selectedDate === 0}
                            >
                                <Ionicons
                                    name="arrow-back-circle-outline"
                                    size={RFPercentage(7)}
                                    color="black"
                                />
                            </TouchableOpacity>
                        </Animated.View>
                    </>
                )}
                {menu === 1 && (
                    <>
                        <View>
                            <Animated.View style={{ height: monthAnimation }}>
                                <View style={{ flexDirection: "row" }}>
                                    <View
                                        style={{
                                            flex: 1,
                                            alignItems: "flex-start",
                                            justifyContent: "center",
                                            paddingLeft: 10,
                                        }}
                                    >
                                        <TouchableOpacity
                                            activeOpacity={0.5}
                                            onPress={() => setMonthYear(monthYear - 1)}
                                        >
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
                                        <View>
                                            <Text style={TextSize.largerSize}>{monthYear}</Text>
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            flex: 1,
                                            alignItems: "flex-end",
                                            justifyContent: "center",
                                            paddingRight: 10,
                                        }}
                                    >
                                        <TouchableOpacity
                                            activeOpacity={0.5}
                                            onPress={() => setMonthYear(monthYear + 1)}
                                        >
                                            <MaterialIcons
                                                name="chevron-right"
                                                size={30}
                                                color="black"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <FlatList
                                    data={monthData}
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
                                                style={[styles.day]}
                                                onPress={() => {
                                                    setMonthMonth(item.id);
                                                    onSelectMonth();
                                                }}
                                            >
                                                <View
                                                    style={
                                                        today.getMonth() + 1 === item.id &&
                                                        today.getFullYear() === monthYear
                                                            ? {
                                                                  backgroundColor: "#99ddff",
                                                                  borderRadius: 40,
                                                                  width: wp("10%"),
                                                                  height: wp("9%"),
                                                                  alignItems: "center",
                                                                  justifyContent: "center",
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    <Text style={TextSize.largeSize}>
                                                        {item.id + "월"}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        </Surface>
                                    )}
                                    numColumns={4}
                                    keyExtractor={(item, index) => index}
                                    scrollEnabled={false}
                                />
                            </Animated.View>
                            <Animated.View
                                style={{
                                    opacity: monthInfoAnimation,
                                }}
                            >
                                <View
                                    style={{
                                        padding: 10,
                                        backgroundColor: "white",
                                    }}
                                >
                                    <Text style={TextSize.largeSize}>
                                        {moment(`${monthYear} ${monthMonth}`, "YYYY M").format(
                                            "YYYY년 MM월 결산"
                                        )}
                                        {today.getMonth() + 1 === monthMonth
                                            ? "(현재까지의 결산)"
                                            : undefined}
                                    </Text>
                                    {loading ? (
                                        <View
                                            style={{
                                                width: wp("100%"),
                                                height: hp("50%"),
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: "white",
                                            }}
                                        >
                                            <ActivityIndicator
                                                animating={true}
                                                size="large"
                                                color="black"
                                            />
                                        </View>
                                    ) : (
                                        <View>
                                            <View style={{ flexDirection: "row" }}>
                                                <Text
                                                    style={[
                                                        TextSize.normalSize,
                                                        { flex: 1, textAlign: "right" },
                                                    ]}
                                                >
                                                    현금 총액:
                                                </Text>
                                                <Text style={[TextSize.normalSize, { flex: 5 }]}>
                                                    {" " + priceToString(monthCash)}원
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row" }}>
                                                <Text
                                                    style={[
                                                        TextSize.normalSize,
                                                        { flex: 1, textAlign: "right" },
                                                    ]}
                                                >
                                                    카드 총액:
                                                </Text>
                                                <Text style={[TextSize.normalSize, { flex: 5 }]}>
                                                    {" " + priceToString(monthCard)}원
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row" }}>
                                                <Text
                                                    style={[
                                                        TextSize.normalSize,
                                                        { flex: 1, textAlign: "right" },
                                                    ]}
                                                >
                                                    합계:
                                                </Text>
                                                <Text style={[TextSize.normalSize, { flex: 5 }]}>
                                                    {" " + priceToString(monthCash + monthCard)}원
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </Animated.View>
                        </View>
                        <Animated.View
                            style={{
                                position: "absolute",
                                right: 10,
                                bottom: 10,
                                opacity: monthBackAnimation,
                                transform: [{ translateY: monthMoveAnimation }],
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    onSelectMonthMenu();
                                }}
                            >
                                <Ionicons
                                    name="arrow-back-circle-outline"
                                    size={RFPercentage(7)}
                                    color="black"
                                />
                            </TouchableOpacity>
                        </Animated.View>
                    </>
                )}
                {menu === 2 && (
                    <>
                        <View>
                            <Animated.View style={{ height: statsAnimation }}>
                                <View style={{ flexDirection: "row" }}>
                                    <View
                                        style={{
                                            flex: 1,
                                            alignItems: "flex-start",
                                            justifyContent: "center",
                                            paddingLeft: 10,
                                        }}
                                    >
                                        <TouchableOpacity
                                            activeOpacity={0.5}
                                            onPress={() => setStatsYear(statsYear - 1)}
                                        >
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
                                        <View>
                                            <Text style={TextSize.largerSize}>{statsYear}</Text>
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            flex: 1,
                                            alignItems: "flex-end",
                                            justifyContent: "center",
                                            paddingRight: 10,
                                        }}
                                    >
                                        <TouchableOpacity
                                            activeOpacity={0.5}
                                            onPress={() => setStatsYear(statsYear + 1)}
                                        >
                                            <MaterialIcons
                                                name="chevron-right"
                                                size={30}
                                                color="black"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <FlatList
                                    data={monthData}
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
                                                style={[styles.day]}
                                                onPress={() => {
                                                    setStatsMonth(item.id);
                                                    onSelectStats();
                                                }}
                                            >
                                                <View
                                                    style={
                                                        today.getMonth() + 1 === item.id &&
                                                        today.getFullYear() === statsYear
                                                            ? {
                                                                  backgroundColor: "#99ddff",
                                                                  borderRadius: 40,
                                                                  width: wp("10%"),
                                                                  height: wp("9%"),
                                                                  alignItems: "center",
                                                                  justifyContent: "center",
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    <Text style={TextSize.largeSize}>
                                                        {item.id + "월"}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        </Surface>
                                    )}
                                    numColumns={4}
                                    keyExtractor={(item, index) => index}
                                    scrollEnabled={false}
                                />
                            </Animated.View>
                            <Animated.View
                                style={{
                                    opacity: statsInfoAnimation,
                                }}
                            >
                                <View
                                    style={{
                                        padding: 10,
                                        backgroundColor: "white",
                                    }}
                                >
                                    <Text style={TextSize.largeSize}>
                                        {moment(`${statsYear} ${statsMonth}`, "YYYY M").format(
                                            "YYYY년 MM월 통계"
                                        )}
                                        {today.getMonth() + 1 === statsMonth
                                            ? "(현재까지의 결산)"
                                            : undefined}
                                    </Text>
                                    {loading ? (
                                        <View
                                            style={{
                                                width: wp("100%"),
                                                height: hp("50%"),
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: "white",
                                            }}
                                        >
                                            <ActivityIndicator
                                                animating={true}
                                                size="large"
                                                color="black"
                                            />
                                        </View>
                                    ) : (
                                        <View>
                                            {renderStats()}
                                            {maxPrice !== 0 && (
                                                <View
                                                    style={{
                                                        flexDirection: "row",
                                                        height: hp("45%"),
                                                    }}
                                                >
                                                    <YAxis
                                                        data={chart}
                                                        contentInset={{ top: 13, bottom: 13 }}
                                                        svg={{
                                                            fill: "black",
                                                            fontSize: RFPercentage(1.9),
                                                        }}
                                                        numberOfTicks={
                                                            maxPrice > 10000000
                                                                ? maxPrice / 10000000
                                                                : maxPrice > 1000000
                                                                ? maxPrice / 1000000
                                                                : maxPrice > 100000
                                                                ? maxPrice / 100000
                                                                : maxPrice / 10000
                                                        }
                                                        formatLabel={(value) =>
                                                            Number(value) !== 0
                                                                ? Number(value)
                                                                      .toString()
                                                                      .substr(
                                                                          0,
                                                                          Number(value).toString()
                                                                              .length - 4
                                                                      ) + "만"
                                                                : 0
                                                        }
                                                        min={0}
                                                        style={{
                                                            marginBottom: 20,
                                                            width: wp("9%"),
                                                        }}
                                                    />
                                                    <View style={{ flex: 1 }}>
                                                        <BarChart
                                                            data={chart}
                                                            style={{ flex: 1, marginLeft: 10 }}
                                                            svg={{ fill: theme.colors.accent }}
                                                            contentInset={{ top: 13, bottom: 13 }}
                                                            gridMin={0}
                                                        >
                                                            <Grid />
                                                            <Labels />
                                                        </BarChart>
                                                        <XAxis
                                                            data={chart}
                                                            formatLabel={(value, index) =>
                                                                label[index]
                                                            }
                                                            svg={{
                                                                fontSize: RFPercentage(1.9),
                                                                fill: "black",
                                                            }}
                                                            contentInset={{ left: 40, right: 30 }}
                                                            style={{
                                                                height: 20,
                                                                width: "100%",
                                                            }}
                                                        />
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </Animated.View>
                        </View>
                        <Animated.View
                            style={{
                                position: "absolute",
                                right: 10,
                                bottom: 10,
                                opacity: statsBackAnimation,
                                transform: [{ translateY: statsMoveAnimation }],
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    onSelectStatsMenu();
                                }}
                            >
                                <Ionicons
                                    name="arrow-back-circle-outline"
                                    size={RFPercentage(7)}
                                    color="black"
                                />
                            </TouchableOpacity>
                        </Animated.View>
                    </>
                )}
            </View>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    menuText: {
        fontSize: RFPercentage(2.2),
    },
    alignCenter: {
        alignItems: "center",
        justifyContent: "center",
    },
    surface: {
        flex: 1,
        height: hp("5%"),
        margin: 5,
        elevation: 6,
        borderRadius: 10,
        justifyContent: "center",
    },
    day: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        height: wp("14%"),
        backgroundColor: "white",
        borderRadius: 10,
    },
});
