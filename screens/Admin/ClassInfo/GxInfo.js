import React, { useContext, useEffect, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Linking,
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
import SegmentedPicker from "react-native-segmented-picker";
import { MaterialIcons } from "@expo/vector-icons";
import myBase, { db } from "../../../config/MyBase";
import moment from "moment";
import { DataContext } from "../../Auth";
import { getHoliday } from "../../../config/hooks";
import { TextSize } from "../../../css/MyStyles";
import Modal from "react-native-modal";
import { RFPercentage } from "react-native-responsive-fontsize";
import { ActivityIndicator, Button, Surface } from "react-native-paper";
import { theme } from "../../../App";

export default ClassInfo = ({ navigation }) => {
    const { width } = Dimensions.get("screen");
    const uid = myBase.auth().currentUser.uid;
    const { classNames } = useContext(DataContext);
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
    const [loadingInModal, setLoadingInModal] = useState(true);
    const gxList = ["pilates", "spinning", "squash", "yoga", "zoomba"];
    const [classData, setClassData] = useState({
        pilates: [],
        spinning: [],
        squash: [],
        yoga: [],
        zoomba: [],
    });
    const [selectedClass, setSelectedClass] = useState({
        trainer: "",
        start: "",
        end: "",
        clients: [],
        currentClient: 0,
        maxClient: 0,
    });
    const [modalClientsInfo, setModalClientsInfo] = useState(false);

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
            let gxList = [];
            await db
                .collectionGroup("class")
                .get()
                .then((snapshots) => {
                    snapshots.forEach((snapshot) => {
                        if (snapshot.id === yearMonthStr) {
                            gxList.push(snapshot.ref.parent.path);
                        }
                    });
                });
            const gxPromises = gxList.map(async (path) => {
                await db
                    .doc(path + "/" + yearMonthStr)
                    .get()
                    .then((doc) => {
                        doc.data().class.forEach((date) => {
                            if (classDate.indexOf(date) === -1) {
                                classDate.push(date);
                            }
                        });
                    });
            });
            await Promise.all(gxPromises);
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
            let obj = {};
            const promises = gxList.map(async (gxName, index) => {
                if (index === 0) {
                    obj[gxName] = [];
                }
                await db
                    .collection("classes")
                    .doc(gxName)
                    .collection("class")
                    .doc(yearMonthStr)
                    .collection(selectedDate.toString())
                    .orderBy("start", "asc")
                    .get()
                    .then((docs) => {
                        let list = [];
                        docs.forEach((doc) => {
                            let data = doc.data();
                            list.push({ ...data, path: doc.ref.path });
                        });
                        return list;
                    })
                    .then(async (list) => {
                        let temp = list;
                        const clientPromises = list.map(async (d, index) => {
                            temp[index]["clients"] = [];
                            if (d.currentClient >= 1) {
                                await db
                                    .collection(d.path + "/clients")
                                    .get()
                                    .then(async (clients) => {
                                        let uidList = [];
                                        clients.forEach((client) => {
                                            uidList.push(client.data().uid);
                                        });
                                        const infoPromises = uidList.map(async (clientUid) => {
                                            await db
                                                .collection("users")
                                                .doc(clientUid)
                                                .get()
                                                .then((doc) => {
                                                    temp[index]["clients"].push({
                                                        name: doc.data().name,
                                                        phoneNumber: doc.data().phoneNumber,
                                                    });
                                                });
                                        });
                                        await Promise.all(infoPromises);
                                    });
                            }
                        });
                        await Promise.all(clientPromises);
                        obj[gxName] = temp;
                    });
            });
            await Promise.all(promises);
            setClassData({ ...classData, ...obj });
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
                />
            )}
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
                onBackdropPress={() => setModalClassInfo(false)}
                onBackButtonPress={() => setModalClassInfo(false)}
            >
                <View style={{ height: hp("95%") }}>
                    <View style={{ flex: 1, backgroundColor: "white" }}>
                        <View
                            style={{ flexDirection: "row", backgroundColor: theme.colors.primary }}
                        >
                            <Button
                                onPress={() => {
                                    setModalClassInfo(false);
                                    setSelectedDate(0);
                                }}
                                labelStyle={[TextSize.largeSize, { color: "white" }]}
                            >
                                닫기
                            </Button>
                            <View
                                style={{ flex: 6, alignItems: "center", justifyContent: "center" }}
                            >
                                <Text style={[TextSize.largeSize, { color: "white" }]}>
                                    {selectedDate + "일"}
                                </Text>
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
                                <ActivityIndicator animating={true} size="large" color="black" />
                            </View>
                        ) : (
                            <ScrollView style={{ marginTop: 5 }}>
                                {gxList.map((gxName, index) => (
                                    <View key={index} style={{ marginBottom: 5 }}>
                                        {classData[gxName].length === 0 ? null : (
                                            <Text
                                                style={[
                                                    TextSize.largeSize,
                                                    {
                                                        marginLeft: 20,
                                                    },
                                                ]}
                                            >
                                                {classNames[gxName] !== undefined
                                                    ? classNames[gxName].ko
                                                    : "Error"}
                                            </Text>
                                        )}
                                        <View
                                            style={{
                                                paddingHorizontal: 10,
                                                alignItems: "center",
                                            }}
                                        >
                                            {classData[gxName].length === 0
                                                ? null
                                                : classData[gxName].map((value, index) => (
                                                      <Surface
                                                          key={index}
                                                          style={{
                                                              width: wp("80%"),
                                                              height: hp("7%"),
                                                              margin: 5,
                                                              elevation: 6,
                                                              borderRadius: 15,
                                                          }}
                                                      >
                                                          <TouchableOpacity
                                                              style={[styles.availButton]}
                                                              onPress={() => {
                                                                  setSelectedClass({
                                                                      ...value,
                                                                      start: moment(
                                                                          value.start.toDate()
                                                                      ).format("HH:mm"),
                                                                      end: moment(
                                                                          value.end.toDate()
                                                                      ).format("HH:mm"),
                                                                  });
                                                                  setModalClientsInfo(true);
                                                              }}
                                                          >
                                                              <View
                                                                  style={{
                                                                      flexDirection: "row",
                                                                  }}
                                                              >
                                                                  <Text style={TextSize.largeSize}>
                                                                      {moment(
                                                                          value.start.toDate()
                                                                      ).format("HH:mm") +
                                                                          " ~ " +
                                                                          moment(
                                                                              value.end.toDate()
                                                                          ).format("HH:mm")}
                                                                  </Text>
                                                                  <Text style={TextSize.largeSize}>
                                                                      {" 강사 " +
                                                                          value.trainer +
                                                                          " (" +
                                                                          value.currentClient +
                                                                          "/" +
                                                                          value.maxClient +
                                                                          ")"}
                                                                  </Text>
                                                              </View>
                                                          </TouchableOpacity>
                                                      </Surface>
                                                  ))}
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>

                <Modal
                    isVisible={modalClientsInfo}
                    style={{ justifyContent: "flex-end", margin: 0 }}
                    swipeDirection={["down"]}
                    onSwipeComplete={() => setModalClientsInfo(false)}
                    onBackdropPress={() => setModalClientsInfo(false)}
                    onBackButtonPress={() => setModalClientsInfo(false)}
                >
                    <View
                        style={{
                            height: hp("85%"),
                            backgroundColor: "white",
                        }}
                    >
                        <View
                            style={{ flexDirection: "row", backgroundColor: theme.colors.primary }}
                        >
                            <Button
                                onPress={() => {
                                    setModalClientsInfo(false);
                                }}
                                labelStyle={[TextSize.largeSize, { color: "white" }]}
                            >
                                <Text style={TextSize.largeSize}>닫기</Text>
                            </Button>
                            <View
                                style={{ flex: 6, alignItems: "center", justifyContent: "center" }}
                            >
                                <Text style={[TextSize.largeSize, { color: "white" }]}>
                                    고객 정보
                                </Text>
                            </View>
                            <View style={{ flex: 1 }} />
                        </View>
                        <View style={{ padding: 10 }}>
                            <Text style={TextSize.largeSize}>
                                {selectedDate}일 {selectedClass.start} ~ {selectedClass.end} (강사{" "}
                                {selectedClass.trainer})
                            </Text>
                            <View style={{ marginTop: 10 }} />
                            {selectedClass.clients.length === 0 ? (
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
                                selectedClass.clients.map((client, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            paddingLeft: 10,
                                            flexDirection: "row",
                                        }}
                                    >
                                        <View
                                            style={{
                                                marginRight: 5,
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
                                                marginRight: 5,
                                                width: wp("11%"),
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text style={TextSize.normalSize}>{client.name}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() =>
                                                Linking.openURL(`tel:${client.phoneNumber}`)
                                            }
                                        >
                                            <Text
                                                style={[
                                                    TextSize.normalSize,
                                                    {
                                                        color: "#3399ff",
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
                    </View>
                </Modal>
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
        backgroundColor: "white",
        borderRadius: 15,
    },
});
