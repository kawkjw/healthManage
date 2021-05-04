import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Dimensions,
    ScrollView,
    Alert,
    Linking,
} from "react-native";
import myBase, { arrayDelete, arrayUnion, db, fieldDelete } from "../../../config/MyBase";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import SegmentedPicker from "react-native-segmented-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { pushNotificationsToPerson } from "../../../config/MyExpo";
import { RFPercentage } from "react-native-responsive-fontsize";
import { getHoliday } from "../../../config/hooks";
import { TextFamily, TextSize, theme } from "../../../css/MyStyles";
import Modal from "react-native-modal";
import RadioForm, {
    RadioButton,
    RadioButtonInput,
    RadioButtonLabel,
} from "react-native-simple-radio-button";
import { ActivityIndicator, Badge, Button, Surface, Text } from "react-native-paper";

export default PT = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const uid = myBase.auth().currentUser.uid;
    const startLimit = route.params.limit[0];
    const endLimit = route.params.limit[1];
    const ptName = route.params.ptName;
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

    const [modalAllDays, setModalAllDays] = useState(false);
    const [noHasClass, setNoHasClass] = useState([]);
    const radioOptions = [
        {
            label: "모든 날짜",
            value: "allDay",
            func: () => {
                setNoHasClass(
                    data.filter((value) => {
                        return (
                            value.isHeader === undefined &&
                            new Date(selectedYear, selectedMonth - 1, Number(value.id)) > today &&
                            value.setFinish === false
                        );
                    })
                );
            },
        },
        {
            label: "주말, 공휴일 제외",
            value: "except",
            func: () => {
                const list = data.filter((value) => {
                    return (
                        value.isHeader === undefined &&
                        value.color === "black" &&
                        new Date(selectedYear, selectedMonth - 1, Number(value.id)) > today &&
                        value.setFinish === false
                    );
                });
                if (list.length === 0) {
                    Alert.alert("경고", "설정 가능한 날이 없습니다.", [{ text: "확인" }], {
                        cancelable: false,
                    });
                    setRadioSelect("allDay");
                } else {
                    setNoHasClass(list);
                }
            },
        },
    ];
    const [radioSelect, setRadioSelect] = useState("allDay");
    const [timeList, setTimeList] = useState([]);
    const [availList, setAvailList] = useState([]);
    const [settingLoading, setSettingLoading] = useState(false);

    useEffect(() => {
        if (route.params.year && route.params.month && route.params.date) {
            setSelectedYear(route.params.year);
            setSelectedMonth(route.params.month);
            setChange(!change);
            setSelectedDate(route.params.date);
            setTimeout(() => setModalTimeTable(true), 1000);
        }
    }, []);

    const makeSetButton = useCallback(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={{ margin: 7, padding: 3 }}
                    onPress={() => {
                        const list = data.filter((value) => {
                            return (
                                value.isHeader === undefined &&
                                new Date(selectedYear, selectedMonth - 1, Number(value.id)) >
                                    today &&
                                value.setFinish === false
                            );
                        });
                        if (list.length === 0) {
                            Alert.alert("경고", "설정 가능한 날이 없습니다.", [{ text: "확인" }], {
                                cancelable: false,
                            });
                        } else {
                            setRadioSelect("allDay");
                            setModalAllDays(true);
                            setSettingLoading(false);
                            setNoHasClass(list);
                        }
                    }}
                >
                    <Text style={[TextSize.largeSize, { color: "white" }]}>
                        {selectedMonth}월 설정
                    </Text>
                </TouchableOpacity>
            ),
        });
    }, [data]);

    useEffect(() => {
        if (data.length !== 0) makeSetButton();
    }, [data]);

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
            let setClass = [];
            let hasClass = [];
            let waitConfirm = [];
            await db
                .collection("classes")
                .doc(ptName)
                .collection(uid)
                .doc(yearMonthStr)
                .get()
                .then((snapshot) => {
                    if (snapshot.exists) {
                        setClass = snapshot.data().class;
                        hasClass = snapshot.data().hasClass;
                        waitConfirm = snapshot.data().waitConfirm;
                    }
                });
            setClass.sort((a, b) => {
                return Number(a) - Number(b);
            });
            setClass.push("-1");
            hasClass.sort((a, b) => {
                return Number(a) - Number(b);
            });
            hasClass.push("-1");
            waitConfirm.sort((a, b) => {
                return Number(a) - Number(b);
            });
            waitConfirm.push("-1");
            let index = 0;
            let hIndex = 0;
            let wIndex = 0;
            const endDate = new Date(selectedYear, selectedMonth, 0);
            const holidayList = await getHoliday(selectedYear, selectedMonth);
            for (let i = 1; i <= endDate.getDate(); i++) {
                const d = new Date(selectedYear, selectedMonth - 1, i);
                let item = {
                    id: i.toString(),
                    pressable: d > today,
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
                if (item["isToday"]) {
                    item["pressable"] = true;
                }
                if (i === Number(setClass[index])) {
                    item["setFinish"] = true;
                    if (item["pressable"] === false) {
                        item["pressable"] = true;
                    }
                    index += 1;
                } else {
                    item["setFinish"] = false;
                }
                if (i === Number(hasClass[hIndex])) {
                    item["hasClass"] = true;
                    hIndex += 1;
                } else {
                    item["hasClass"] = false;
                }
                if (i === Number(waitConfirm[wIndex])) {
                    item["waitConfirm"] = true;
                    wIndex += 1;
                } else {
                    item["waitConfirm"] = false;
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
        let tlist = [];
        let alist = [];
        for (let i = Number(startLimit); i < Number(endLimit); i++) {
            let s =
                (i < 10 ? "0" + i : i) + ":00 ~ " + (i + 1 < 10 ? "0" + (i + 1) : i + 1) + ":00";
            tlist.push(s);
            alist.push(null);
        }
        setTimeList(tlist);
        setAvailList(alist);
    }, []);

    const showTimeTable = async () => {
        setLoading(true);
        let finishSetUp = true;
        let timeList = [];
        const yearMonthStr =
            selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        for (let i = Number(startLimit); i < Number(endLimit); i++) {
            let s =
                (i < 10 ? "0" + i : i) + ":00 ~ " + (i + 1 < 10 ? "0" + (i + 1) : i + 1) + ":00";
            let obj = {};
            obj["str"] = s;
            await db
                .collection("classes")
                .doc(ptName)
                .collection(uid)
                .doc(yearMonthStr)
                .collection(selectedDate.toString())
                .doc(s)
                .get()
                .then(async (bool) => {
                    if (bool.exists) {
                        obj["submit"] = true;
                        obj["isAvail"] = bool.data().isAvail;
                        obj["hasReserve"] = bool.data().hasReservation;
                        obj["notEditable"] =
                            today >
                            new Date(selectedYear, selectedMonth - 1, selectedDate, i - 3, 0);
                        if (bool.data().hasReservation) {
                            const { name, phoneNumber } = (
                                await db.collection("users").doc(bool.data().clientUid).get()
                            ).data();
                            obj["clientName"] = name;
                            obj["clientPhone"] = phoneNumber;
                            obj["clientUid"] = bool.data().clientUid;
                            obj["confirm"] = bool.data().confirm;
                            if (bool.data().isGroup !== undefined) {
                                if (bool.data().isGroup === true) {
                                    obj["isGroup"] = true;
                                } else {
                                    obj["isGroup"] = false;
                                }
                            } else {
                                obj["isGroup"] = false;
                            }
                            if (bool.data().ot !== undefined) {
                                obj["isOT"] = true;
                            } else {
                                obj["isOT"] = false;
                            }
                        }
                    } else {
                        obj["submit"] = false;
                        finishSetUp = false;
                        obj["notEditable"] =
                            today >
                            new Date(selectedYear, selectedMonth - 1, selectedDate, i - 3, 0);
                    }
                })
                .catch((error) => console.log(error.message));
            timeList.push(obj);
        }
        setAvailTimeList(timeList);
        setAlreadySetUp(finishSetUp);
        if (finishSetUp) {
            await db
                .collection("classes")
                .doc(ptName)
                .collection(uid)
                .doc(yearMonthStr)
                .update({ class: arrayUnion(selectedDate.toString()) })
                .then()
                .catch(async (error) => {
                    await db
                        .collection("classes")
                        .doc(ptName)
                        .collection(uid)
                        .doc(yearMonthStr)
                        .set({
                            class: [selectedDate.toString()],
                            hasClass: [],
                            waitConfirm: [],
                        });
                });
        }
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

    const setAvailableTime = async (availTime) => {
        const yearMonthStr =
            selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        await db
            .collection("classes")
            .doc(ptName)
            .collection(uid)
            .doc(yearMonthStr)
            .collection(selectedDate.toString())
            .doc(availTime)
            .set({ isAvail: true, hasReservation: false });
        const backup = selectedDate;
        setSelectedDate(0);
        setSelectedDate(backup);
    };

    const setUnAvailabeTime = async (availTime) => {
        const yearMonthStr =
            selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        await db
            .collection("classes")
            .doc(ptName)
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
            selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        await db
            .collection("classes")
            .doc(ptName)
            .collection(uid)
            .doc(yearMonthStr)
            .collection(selectedDate.toString())
            .doc(availTime)
            .delete();
        const backup = selectedDate;
        setSelectedDate(0);
        setSelectedDate(backup);
    };

    const confirmClass = async (clientUid, availTime) => {
        const yearMonthStr =
            selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        const { hasReservation } = (
            await db
                .collection("classes")
                .doc(ptName)
                .collection(uid)
                .doc(yearMonthStr)
                .collection(selectedDate.toString())
                .doc(availTime)
                .get()
        ).data();
        if (hasReservation) {
            await db
                .collection("classes")
                .doc(ptName)
                .collection(uid)
                .doc(yearMonthStr)
                .collection(selectedDate.toString())
                .doc(availTime)
                .update({ confirm: true });
            await db
                .collection("classes")
                .doc(ptName)
                .collection(uid)
                .doc(yearMonthStr)
                .update({
                    hasClass: arrayUnion(selectedDate.toString()),
                    waitConfirm: arrayDelete(selectedDate.toString()),
                });
            await db
                .collection("classes")
                .doc(ptName)
                .collection(uid)
                .doc(yearMonthStr)
                .collection(selectedDate.toString())
                .where("confirm", "==", false)
                .get()
                .then(async (docs) => {
                    if (docs.size <= 0) {
                        await db
                            .collection("classes")
                            .doc(ptName)
                            .collection(uid)
                            .doc(yearMonthStr)
                            .update({ waitConfirm: arrayDelete(selectedDate.toString()) });
                    }
                });
            await db
                .collection("users")
                .doc(uid)
                .collection("classes")
                .doc(yearMonthStr)
                .update({ ptDate: arrayUnion(selectedDate.toString()) })
                .catch(async () => {
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("classes")
                        .doc(yearMonthStr)
                        .set({ ptDate: [selectedDate.toString()] });
                });
            await db
                .collection("users")
                .doc(uid)
                .collection("classes")
                .doc(yearMonthStr)
                .collection(selectedDate.toString())
                .doc(availTime)
                .set({ clientUid: clientUid });
            await db
                .collection("users")
                .doc(clientUid)
                .collection("reservation")
                .doc(yearMonthStr)
                .collection(selectedDate.toString())
                .doc(availTime)
                .update({ confirm: true });
            await db
                .collection("users")
                .doc(clientUid)
                .collection("memberships")
                .doc("list")
                .collection(ptName === "pt" ? ptName : ptName + "pt")
                .orderBy("payDay", "desc")
                .limit(1)
                .get()
                .then(async (docs) => {
                    let docRef;
                    let count = 0;
                    docs.forEach((doc) => {
                        count = doc.data().count;
                        docRef = doc.ref;
                    });
                    if (count === 0) {
                        await docRef.set({ expiredStatus: true }, { merge: true });
                    }
                });
            await pushNotificationsToPerson(
                myBase.auth().currentUser.displayName,
                clientUid,
                "예약 승인되었습니다.",
                `${selectedDate}일 ${availTime}`,
                { navigation: "Profile" }
            );
            Alert.alert(
                "성공",
                "예약 승인되었습니다.",
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
    };

    const cancelClass = async (clientUid, availTime) => {
        const yearMonthStr =
            selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        const { hasReservation } = (
            await db
                .collection("classes")
                .doc(ptName)
                .collection(uid)
                .doc(yearMonthStr)
                .collection(selectedDate.toString())
                .doc(availTime)
                .get()
        ).data();
        if (hasReservation) {
            await db
                .collection("classes")
                .doc(ptName)
                .collection(uid)
                .doc(yearMonthStr)
                .collection(selectedDate.toString())
                .doc(availTime)
                .get()
                .then((doc) => {
                    let dataList = [false];
                    if (doc.data().ot !== undefined) {
                        dataList[0] = doc.data().ot;
                    }
                    if (doc.data().notiIdentifier !== undefined) {
                        dataList.push(doc.data().notiIdentifier);
                    }
                    return dataList;
                })
                .then(async (dataList) => {
                    await db
                        .collection("classes")
                        .doc(ptName)
                        .collection(uid)
                        .doc(yearMonthStr)
                        .update({ waitConfirm: arrayDelete(selectedDate.toString()) });
                    await db
                        .collection("classes")
                        .doc(ptName)
                        .collection(uid)
                        .doc(yearMonthStr)
                        .collection(selectedDate.toString())
                        .doc(availTime)
                        .update({
                            clientUid: fieldDelete(),
                            confirm: fieldDelete(),
                            hasReservation: false,
                            notiIdentifier: fieldDelete(),
                            isGroup: fieldDelete(),
                            ot: fieldDelete(),
                            priceByMembership: fieldDelete(),
                        });
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("classes")
                        .doc(yearMonthStr)
                        .update({ ptDate: arrayDelete(selectedDate.toString()) })
                        .catch((error) => {
                            console.log("trainer cancel class", error.message);
                        });
                    await db
                        .collection("users")
                        .doc(uid)
                        .collection("classes")
                        .doc(yearMonthStr)
                        .collection(selectedDate.toString())
                        .doc(availTime)
                        .delete()
                        .catch((error) => {
                            console.log("trainer cancel class", error.message);
                        });
                    await db
                        .collection("users")
                        .doc(clientUid)
                        .collection("reservation")
                        .doc(yearMonthStr)
                        .collection(selectedDate.toString())
                        .doc(availTime)
                        .delete();
                    await db
                        .collection("users")
                        .doc(clientUid)
                        .collection("reservation")
                        .doc(yearMonthStr)
                        .collection(selectedDate.toString())
                        .get()
                        .then(async (snapshots) => {
                            if (snapshots.size === 0) {
                                await db
                                    .collection("users")
                                    .doc(clientUid)
                                    .collection("reservation")
                                    .doc(yearMonthStr)
                                    .update({
                                        date: arrayDelete(selectedDate.toString()),
                                    });
                            }
                        });
                    if (dataList[0]) {
                        await db
                            .collection("users")
                            .doc(clientUid)
                            .collection("memberships")
                            .doc("list")
                            .collection("health")
                            .orderBy("payDay", "desc")
                            .limit(1)
                            .get()
                            .then(async (docs) => {
                                let docRef;
                                let count = 0;
                                docs.forEach((doc) => {
                                    docRef = doc.ref;
                                    count = doc.data().otCount;
                                });
                                if (count === 1) {
                                    await docRef.update({ otCount: fieldDelete() });
                                } else if (count === 0) {
                                    await docRef.update({ otCount: 1 });
                                }
                            });
                    } else {
                        await db
                            .collection("users")
                            .doc(clientUid)
                            .collection("memberships")
                            .doc("list")
                            .collection(ptName === "pt" ? ptName : ptName + "pt")
                            .orderBy("payDay", "desc")
                            .limit(1)
                            .get()
                            .then(async (docs) => {
                                let docRef;
                                let count = 0;
                                docs.forEach((doc) => {
                                    count = doc.data().count;
                                    docRef = doc.ref;
                                });
                                await docRef.update({ count: count + 1 });
                            });
                    }
                    let data = { cancel: true };
                    if (route.params.identifier) {
                        data["identifier"] = route.params.identifier;
                    } else {
                        data["identifier"] = dataList[1];
                    }
                    await pushNotificationsToPerson(
                        myBase.auth().currentUser.displayName,
                        clientUid,
                        "예약 취소되었습니다.",
                        `${selectedDate}일 ${availTime}`,
                        data
                    );
                    Alert.alert(
                        "취소됨",
                        "예약이 취소되었습니다.",
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
                });
        }
    };

    const alertWhenClose = () =>
        Alert.alert(
            "경고",
            "저장되지 않은 설정은 사라집니다.\n그래도 닫으시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                {
                    text: "확인",
                    onPress: () => {
                        setModalAllDays(false);
                        setAvailList(availList.map((_) => null));
                    },
                },
            ],
            { cancelable: false }
        );

    const alertWhenTableClose = () => {
        if (alreadySetUp) {
            setModalTimeTable(false);
            setSelectedDate(0);
        } else {
            Alert.alert(
                "경고",
                "시간 설정이 완료되지 않았습니다.\n전 화면으로 돌아가길 원하십니까?",
                [
                    { text: "취소" },
                    {
                        text: "확인",
                        onPress: () => {
                            setModalTimeTable(false);
                            setSelectedDate(0);
                        },
                    },
                ],
                { cancelable: false }
            );
        }
        setChange(!change);
    };

    const setAllDays = async () => {
        if (availList.includes(null)) {
            Alert.alert("경고", "모든 시간 설정 해주시기 바랍니다.", [{ text: "확인" }], {
                cancelable: false,
            });
            return;
        }
        setSettingLoading(true);
        const yearMonthStr =
            selectedYear + "-" + (selectedMonth < 10 ? "0" + selectedMonth : selectedMonth);
        await db
            .collection("classes")
            .doc(ptName)
            .collection(uid)
            .doc(yearMonthStr)
            .get()
            .then((doc) => {
                if (doc.exists === false) {
                    doc.ref.set({ class: [], hasClass: [], waitConfirm: [] });
                }
            });
        const rootPromises = noHasClass.map(async (date) => {
            const setPromises = timeList.map(async (time, index) => {
                const data =
                    availList[index] === true
                        ? { isAvail: availList[index], hasReservation: false }
                        : { isAvail: availList[index] };
                await db
                    .collection("classes")
                    .doc(ptName)
                    .collection(uid)
                    .doc(yearMonthStr)
                    .collection(date.id)
                    .doc(time)
                    .set(data);
            });
            await Promise.all(setPromises);
            await db
                .collection("classes")
                .doc(ptName)
                .collection(uid)
                .doc(yearMonthStr)
                .update({ class: arrayUnion(date.id) });
        });
        await Promise.all(rootPromises);
        setSettingLoading(false);
        Alert.alert(
            "성공",
            "설정 완료했습니다.",
            [
                {
                    text: "확인",
                    onPress: () => {
                        setModalAllDays(false);
                        setAvailList(availList.map((_) => null));
                        setChange(!change);
                    },
                },
            ],
            { cancelable: false }
        );
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
                                    : item.setFinish
                                    ? { backgroundColor: "white" }
                                    : { backgroundColor: "#b3b3b3" },
                            ]}
                            onPress={() => {
                                setModalTimeTable(item.pressable);
                                setSelectedDate(Number(item.id));
                            }}
                            disabled={!item.pressable}
                        >
                            {item.hasClass && (
                                <Badge
                                    visible={true}
                                    size={10}
                                    style={{ position: "absolute", top: 7, right: 5 }}
                                />
                            )}
                            {item.waitConfirm && (
                                <Badge
                                    visible={true}
                                    size={10}
                                    style={{
                                        position: "absolute",
                                        top: 7,
                                        right: 5,
                                        backgroundColor: "blue",
                                    }}
                                />
                            )}
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
                isVisible={modalTimeTable}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => alertWhenTableClose()}
                onBackButtonPress={() => alertWhenTableClose()}
            >
                <View
                    style={{
                        height: hp("95%"),
                        backgroundColor: "white",
                    }}
                >
                    <View style={{ flexDirection: "row", backgroundColor: theme.colors.primary }}>
                        <Button
                            onPress={() => alertWhenTableClose()}
                            labelStyle={{ color: "white", fontSize: RFPercentage(2.2) }}
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
                            <ActivityIndicator animating={true} color="black" size="large" />
                        </View>
                    ) : (
                        <ScrollView
                            style={{
                                flex: 10,
                                marginTop: 5,
                                alignSelf: "stretch",
                                marginHorizontal: 10,
                            }}
                            contentContainerStyle={{ alignItems: "center" }}
                        >
                            {availTimeList.map((availTime, index) => (
                                <View
                                    key={index}
                                    style={{
                                        flex: 1,
                                        width: width,
                                        height: hp("10%"),
                                        borderBottomWidth: 1,
                                        borderBottomColor: "grey",
                                        flexDirection: "row",
                                        paddingHorizontal: 10,
                                    }}
                                >
                                    <View
                                        style={{
                                            flex: 3,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            paddingLeft: 10,
                                        }}
                                    >
                                        <Text style={TextSize.normalSize}>{availTime.str}</Text>
                                    </View>
                                    <View
                                        style={{
                                            flex: 7,
                                            flexDirection: "row",
                                            paddingHorizontal: 10,
                                            marginBottom: 15,
                                            marginTop: 10,
                                        }}
                                    >
                                        {availTime.submit === false ? (
                                            <>
                                                <Surface
                                                    style={{
                                                        flex: 1,
                                                        elevation: 6,
                                                        borderRadius: 20,
                                                        marginRight: 7,
                                                    }}
                                                >
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.availButton,
                                                            {
                                                                backgroundColor: "#66ccff",
                                                            },
                                                        ]}
                                                        onPress={() =>
                                                            setAvailableTime(availTime.str)
                                                        }
                                                    >
                                                        <Text style={TextSize.largeSize}>가능</Text>
                                                    </TouchableOpacity>
                                                </Surface>
                                                <Surface
                                                    style={{
                                                        flex: 1,
                                                        elevation: 6,
                                                        borderRadius: 20,
                                                        marginLeft: 7,
                                                    }}
                                                >
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.availButton,
                                                            {
                                                                backgroundColor: "#ff9999",
                                                            },
                                                        ]}
                                                        onPress={() =>
                                                            setUnAvailabeTime(availTime.str)
                                                        }
                                                    >
                                                        <Text style={TextSize.largeSize}>
                                                            불가능
                                                        </Text>
                                                    </TouchableOpacity>
                                                </Surface>
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
                                                        style={[
                                                            {
                                                                alignItems: "center",
                                                            },
                                                            availTime.hasReserve &&
                                                            !availTime.confirm
                                                                ? { flex: 2 }
                                                                : { flex: 3 },
                                                        ]}
                                                    >
                                                        {availTime.hasReserve ? (
                                                            <>
                                                                <Text style={TextSize.normalSize}>
                                                                    {(availTime.isOT
                                                                        ? "OT: "
                                                                        : availTime.isGroup
                                                                        ? "PT 그룹: "
                                                                        : "PT: ") +
                                                                        availTime.clientName}
                                                                </Text>
                                                                <TouchableOpacity
                                                                    onPress={() =>
                                                                        Linking.openURL(
                                                                            `tel:${availTime.clientPhone}`
                                                                        )
                                                                    }
                                                                >
                                                                    <Text
                                                                        style={[
                                                                            TextSize.normalSize,
                                                                            {
                                                                                color: "blue",
                                                                            },
                                                                        ]}
                                                                    >
                                                                        {availTime.clientPhone}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            </>
                                                        ) : (
                                                            <Text style={TextSize.normalSize}>
                                                                예약이 없습니다.
                                                            </Text>
                                                        )}
                                                    </View>
                                                ) : (
                                                    <View
                                                        style={{
                                                            flex: 3,
                                                            alignItems: "center",
                                                        }}
                                                    >
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
                                                    </View>
                                                )}
                                                {availTime.hasReserve ? (
                                                    availTime.confirm ? (
                                                        availTime.notEditable ? null : (
                                                            <Surface
                                                                style={{
                                                                    flex: 1,
                                                                    elevation: 6,
                                                                    borderRadius: 20,
                                                                }}
                                                            >
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
                                                                        Alert.alert(
                                                                            "예약취소",
                                                                            "예약 취소하시겠습니까?",
                                                                            [
                                                                                {
                                                                                    text: "취소",
                                                                                },
                                                                                {
                                                                                    text: "확인",
                                                                                    onPress: () =>
                                                                                        cancelClass(
                                                                                            availTime.clientUid,
                                                                                            availTime.str
                                                                                        ),
                                                                                },
                                                                            ],
                                                                            { cancelable: false }
                                                                        )
                                                                    }
                                                                >
                                                                    <Text>취소</Text>
                                                                </TouchableOpacity>
                                                            </Surface>
                                                        )
                                                    ) : availTime.notEditable ? null : (
                                                        <>
                                                            <Surface
                                                                style={{
                                                                    flex: 1,
                                                                    elevation: 6,
                                                                    borderRadius: 20,
                                                                    marginRight: 3,
                                                                }}
                                                            >
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
                                                                        Alert.alert(
                                                                            "예약승인",
                                                                            "예약 승인하시겠습니까?",
                                                                            [
                                                                                {
                                                                                    text: "취소",
                                                                                },
                                                                                {
                                                                                    text: "확인",
                                                                                    onPress: () =>
                                                                                        confirmClass(
                                                                                            availTime.clientUid,
                                                                                            availTime.str
                                                                                        ),
                                                                                },
                                                                            ],
                                                                            { cancelable: false }
                                                                        )
                                                                    }
                                                                >
                                                                    <Text>확인</Text>
                                                                </TouchableOpacity>
                                                            </Surface>
                                                            <Surface
                                                                style={{
                                                                    flex: 1,
                                                                    elevation: 6,
                                                                    borderRadius: 20,
                                                                    marginLeft: 3,
                                                                }}
                                                            >
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
                                                                        Alert.alert(
                                                                            "예약 취소",
                                                                            "예약 취소하시겠습니까?",
                                                                            [
                                                                                {
                                                                                    text: "취소",
                                                                                },
                                                                                {
                                                                                    text: "확인",
                                                                                    onPress: () =>
                                                                                        cancelClass(
                                                                                            availTime.clientUid,
                                                                                            availTime.str
                                                                                        ),
                                                                                },
                                                                            ],
                                                                            { cancelable: false }
                                                                        )
                                                                    }
                                                                >
                                                                    <Text>취소</Text>
                                                                </TouchableOpacity>
                                                            </Surface>
                                                        </>
                                                    )
                                                ) : availTime.notEditable ? null : (
                                                    <Surface
                                                        style={{
                                                            flex: 1,
                                                            elevation: 6,
                                                            borderRadius: 20,
                                                        }}
                                                    >
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.availButton,
                                                                {
                                                                    backgroundColor: "white",
                                                                    height: hp("7%"),
                                                                },
                                                            ]}
                                                            onPress={() =>
                                                                resetAvailTime(availTime.str)
                                                            }
                                                        >
                                                            <Text>리셋</Text>
                                                        </TouchableOpacity>
                                                    </Surface>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </Modal>
            <Modal
                isVisible={modalAllDays}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => alertWhenClose()}
                onBackButtonPress={() => alertWhenClose()}
            >
                <View
                    style={{
                        height: hp("95%"),
                        backgroundColor: "white",
                    }}
                >
                    {settingLoading && (
                        <View
                            style={{
                                backgroundColor: "rgba(153, 153, 153, 0.5)",
                                width: wp("100%"),
                                height: hp("95%"),
                                position: "absolute",
                                zIndex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ActivityIndicator color="black" size={60} />
                        </View>
                    )}
                    <View
                        style={{
                            flexDirection: "row",
                            backgroundColor: theme.colors.primary,
                        }}
                    >
                        <Button
                            onPress={() => alertWhenClose()}
                            labelStyle={{ color: "white", fontSize: RFPercentage(2.2) }}
                        >
                            닫기
                        </Button>
                        <View style={{ flex: 6, alignItems: "center", justifyContent: "center" }}>
                            <Text style={[TextSize.largeSize, { color: "white" }]}>
                                {selectedMonth + "월달 설정"}
                            </Text>
                        </View>
                        <Button
                            onPress={() => {
                                if (availList.includes(null)) {
                                    Alert.alert(
                                        "경고",
                                        "모든 시간 설정 해주시기 바랍니다.",
                                        [{ text: "확인" }],
                                        { cancelable: false }
                                    );
                                } else {
                                    Alert.alert(
                                        "경고",
                                        "설정 완료하는 시간이 오래 걸릴 수 있습니다.",
                                        [{ text: "확인", onPress: () => setAllDays() }],
                                        { cancelable: false }
                                    );
                                }
                            }}
                            labelStyle={{ color: "white", fontSize: RFPercentage(2.2) }}
                        >
                            설정
                        </Button>
                    </View>
                    <View style={{ marginTop: 10 }}>
                        <RadioForm formHorizontal={true} animation={true}>
                            {radioOptions.map((option, index) => (
                                <View key={index}>
                                    <RadioButton
                                        labelHorizontal={true}
                                        wrapStyle={{ marginLeft: 10 }}
                                    >
                                        <RadioButtonInput
                                            obj={option}
                                            index={index}
                                            isSelected={option.value === radioSelect}
                                            onPress={() => {
                                                setRadioSelect(option.value);
                                                option.func();
                                            }}
                                            buttonSize={15}
                                            buttonInnerColor={theme.colors.accent}
                                            buttonOuterColor={theme.colors.accent}
                                        />
                                        <RadioButtonLabel
                                            obj={option}
                                            index={index}
                                            onPress={() => {
                                                setRadioSelect(option.value);
                                                option.func();
                                            }}
                                            labelStyle={[
                                                TextFamily.NanumRegular,
                                                {
                                                    fontSize: RFPercentage(2.2),
                                                    marginLeft: 5,
                                                },
                                            ]}
                                        />
                                    </RadioButton>
                                </View>
                            ))}
                        </RadioForm>
                    </View>
                    <View style={{ paddingLeft: 20, marginBottom: 5 }}>
                        <Text style={[TextSize.normalSize, { color: "#595959" }]}>
                            이미 설정된 날은 제외됩니다.
                        </Text>
                    </View>
                    <ScrollView
                        style={{
                            marginTop: 5,
                            alignSelf: "stretch",
                            marginHorizontal: 10,
                        }}
                        contentContainerStyle={{ alignItems: "center" }}
                    >
                        {timeList.map((time, index) => (
                            <View
                                key={index}
                                style={[
                                    {
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
                                        flex: 2,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        paddingLeft: 10,
                                    }}
                                >
                                    <Text style={TextSize.normalSize}>{time}</Text>
                                </View>
                                <View
                                    style={{
                                        flex: 4,
                                        flexDirection: "row",
                                        marginLeft: 10,
                                        paddingHorizontal: 10,
                                        marginBottom: 15,
                                        marginTop: 10,
                                    }}
                                >
                                    <Surface
                                        style={{
                                            flex: 1,
                                            elevation: 6,
                                            borderRadius: 20,
                                            marginRight: 7,
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={[
                                                styles.availButton,
                                                availList[index] === null ||
                                                availList[index] === false
                                                    ? { backgroundColor: "white" }
                                                    : {
                                                          backgroundColor: "#66ccff",
                                                      },
                                            ]}
                                            onPress={() => {
                                                let change = availList.slice();
                                                change[index] = true;
                                                setAvailList(change);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    TextSize.largeSize,
                                                    availList[index] === null ||
                                                    availList[index] === false
                                                        ? { color: "blue" }
                                                        : { color: "black" },
                                                ]}
                                            >
                                                가능
                                            </Text>
                                        </TouchableOpacity>
                                    </Surface>
                                    <Surface
                                        style={{
                                            flex: 1,
                                            elevation: 6,
                                            borderRadius: 20,
                                            marginLeft: 7,
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={[
                                                styles.availButton,
                                                availList[index] === null ||
                                                availList[index] === true
                                                    ? { backgroundColor: "white" }
                                                    : {
                                                          backgroundColor: "#ff9999",
                                                      },
                                            ]}
                                            onPress={() => {
                                                let change = availList.slice();
                                                change[index] = false;
                                                setAvailList(change);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    TextSize.largeSize,
                                                    availList[index] === null ||
                                                    availList[index] === true
                                                        ? { color: "red" }
                                                        : { color: "black" },
                                                ]}
                                            >
                                                불가능
                                            </Text>
                                        </TouchableOpacity>
                                    </Surface>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
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
        borderRadius: 20,
    },
});
