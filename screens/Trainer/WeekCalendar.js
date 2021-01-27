import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    Text,
    StyleSheet,
    TouchableOpacity,
    View,
    Alert,
    Image,
    Modal,
    TextInput,
    Keyboard,
    FlatList,
} from "react-native";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import WeeklyCalendar from "../../calendar/index";
import moment from "moment";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import myBase, { arrayDelete, db } from "../../config/MyBase";
import { getStatusBarHeight } from "react-native-status-bar-height";
import { AuthStyles, MyStyles } from "../../css/MyStyles";

export default WeekCalendar = () => {
    const [render, setRender] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const [refresh, setRefresh] = useState(false);
    const [modalNewClass, setModalNewClass] = useState(false);
    const [modalSearchClient, setModalSearchClient] = useState(false);
    const [clientName, setClientName] = useState("");
    const [nameInput, setNameInput] = useState(true);
    const [phoneInput, setPhoneInput] = useState(true);
    const [clientPhone, setClientPhone] = useState("");
    const [searchButton, setSearchButton] = useState(false);
    const [classStartDate, setClassStartDate] = useState(new Date());
    const [classEndDate, setClassEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState("date");
    const classDB = db
        .collection("users")
        .doc(myBase.auth().currentUser.uid)
        .collection("classes");

    const [findClients, setFindClients] = useState([]);

    const removeClass = async (id, date) => {
        const docName = [
            date.getFullYear().toString(),
            (date.getMonth() + 1).toString(),
        ].join("-");
        const dateId =
            date.getDate() < 10
                ? "0" + date.getDate()
                : date.getDate().toString();
        await classDB
            .doc(docName)
            .collection(dateId)
            .doc(id)
            .delete()
            .then(async () => {
                await classDB
                    .doc(docName)
                    .collection(dateId)
                    .get()
                    .then(async (snapshots) => {
                        if (snapshots.empty) {
                            await classDB
                                .doc(docName)
                                .update({ class: arrayDelete(dateId) });
                        }
                    });
                Alert.alert("Success", "Delete Success", [
                    { text: "OK", onPress: () => setRefresh(!refresh) },
                ]);
            });
    };

    useEffect(() => {
        const getData = async () => {
            setIsLoading(true);
            let tempEvent = [];
            const pad = (num) => {
                return ("0" + num).slice(-2);
            };
            const hhmmss = (secs) => {
                let seconds = secs;
                let minutes = Math.floor(seconds / 60);
                seconds = seconds % 60;
                let hours = Math.floor(minutes / 60);
                minutes = minutes % 60;
                return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            };
            await classDB.get().then((snapshots) => {
                snapshots.forEach(async (snapshot) => {
                    await classDB
                        .doc(snapshot.id)
                        .get()
                        .then(async (doc) => {
                            const dayArray = doc.data().class;
                            dayArray.forEach(async (day) => {
                                await classDB
                                    .doc(snapshot.id)
                                    .collection(day)
                                    .orderBy("start", "asc")
                                    .get()
                                    .then((documents) => {
                                        documents.forEach((document) => {
                                            const eventData = document.data();
                                            const startDate = moment(
                                                eventData.start.toDate()
                                            );
                                            const endDate = moment(
                                                eventData.end.toDate()
                                            );
                                            const duration = hhmmss(
                                                endDate.diff(
                                                    startDate,
                                                    "seconds"
                                                )
                                            );
                                            tempEvent.push({
                                                start: startDate.format(
                                                    "YYYY-MM-DD hh:mm:ss"
                                                ),
                                                duration: duration,
                                                note: eventData.clientName,
                                                id: document.id,
                                                startDate: eventData.start.toDate(),
                                            });
                                        });
                                    });
                            });
                            setTimeout(() => {
                                setRender(
                                    <WeeklyCalendar
                                        refresh={refresh}
                                        events={tempEvent}
                                        locale="ko"
                                        style={{ height: hp("90%") }}
                                        themeColor="#1E90FF"
                                        renderEvent={(event, j) => {
                                            let startTime = moment(event.start)
                                                .format("LT")
                                                .toString();
                                            let duration = event.duration.split(
                                                ":"
                                            );
                                            let seconds =
                                                parseInt(duration[0]) * 3600 +
                                                parseInt(duration[1]) * 60 +
                                                parseInt(duration[2]);
                                            let endTime = moment(event.start)
                                                .add(seconds, "seconds")
                                                .format("LT")
                                                .toString();
                                            return (
                                                <View key={j}>
                                                    <TouchableOpacity
                                                        style={styles.event}
                                                        onPress={() => {
                                                            Alert.alert(
                                                                event.note,
                                                                event.start,
                                                                [
                                                                    {
                                                                        text:
                                                                            "Delete",
                                                                        onPress: () => {
                                                                            Alert.alert(
                                                                                "Are you sure?",
                                                                                "",
                                                                                [
                                                                                    {
                                                                                        text:
                                                                                            "Cancel",
                                                                                    },
                                                                                    {
                                                                                        text:
                                                                                            "Delete",
                                                                                        onPress: () =>
                                                                                            removeClass(
                                                                                                event.id,
                                                                                                event.startDate
                                                                                            ),
                                                                                        style:
                                                                                            "destructive",
                                                                                    },
                                                                                ]
                                                                            );
                                                                        },
                                                                        style:
                                                                            "destructive",
                                                                    },
                                                                    {
                                                                        text:
                                                                            "OK",
                                                                    },
                                                                ]
                                                            );
                                                        }}
                                                    >
                                                        <View
                                                            style={
                                                                styles.eventDuration
                                                            }
                                                        >
                                                            <View
                                                                style={
                                                                    styles.durationContainer
                                                                }
                                                            >
                                                                <View
                                                                    style={
                                                                        styles.durationDot
                                                                    }
                                                                />
                                                                <Text
                                                                    style={
                                                                        styles.durationText
                                                                    }
                                                                >
                                                                    {startTime}
                                                                </Text>
                                                            </View>
                                                            <View
                                                                style={{
                                                                    paddingTop: 10,
                                                                }}
                                                            />
                                                            <View
                                                                style={
                                                                    styles.durationContainer
                                                                }
                                                            >
                                                                <View
                                                                    style={
                                                                        styles.durationDot
                                                                    }
                                                                />
                                                                <Text
                                                                    style={
                                                                        styles.durationText
                                                                    }
                                                                >
                                                                    {endTime}
                                                                </Text>
                                                            </View>
                                                            <View
                                                                style={
                                                                    styles.durationDotConnector
                                                                }
                                                            />
                                                        </View>
                                                        <View
                                                            style={
                                                                styles.eventNote
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.eventText
                                                                }
                                                            >
                                                                {event.note}
                                                            </Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                    <View
                                                        style={
                                                            styles.lineSeparator
                                                        }
                                                    />
                                                </View>
                                            );
                                        }}
                                    />
                                );
                                setIsLoading(false);
                            }, 1000);
                        });
                });
            });
        };
        getData();
    }, [refresh]);

    const showDateStartPicker = () => {
        Keyboard.dismiss();
        setShowStartPicker(true);
        setPickerMode("date");
    };

    const showTimeStartPicker = () => {
        Keyboard.dismiss();
        setShowStartPicker(true);
        setPickerMode("time");
    };

    const showDateEndPicker = () => {
        Keyboard.dismiss();
        setShowEndPicker(true);
        setPickerMode("date");
    };

    const showTimeEndPicker = () => {
        Keyboard.dismiss();
        setShowEndPicker(true);
        setPickerMode("time");
    };

    const startPickerOnChange = (date) => {
        setShowStartPicker(!showStartPicker);
        setClassStartDate(date);
        setClassEndDate(date);
    };

    const endPickerOnChange = (date) => {
        setShowEndPicker(!showEndPicker);
        setClassEndDate(date);
    };

    const createNewClass = async () => {
        if (clientName.length !== 0 && clientPhone.length !== 0) {
            const startDocId = [
                classStartDate.getFullYear().toString(),
                classStartDate.getMonth() + 1 < 10
                    ? "0" + (classStartDate.getMonth() + 1)
                    : (classStartDate.getMonth() + 1).toString(),
            ].join("-");
            const startDate =
                classStartDate.getDate() < 10
                    ? "0" + classStartDate.getDate().toString()
                    : classStartDate.getDate().toString();
            await classDB.doc(startDocId).collection(startDate).add({
                clientName: clientName,
                start: classStartDate,
                end: classEndDate,
            });
            await classDB
                .doc(startDocId)
                .get()
                .then(async (doc) => {
                    const toDoArray = doc.data().class;
                    if (toDoArray.indexOf(startDate) === -1) {
                        toDoArray.push(startDate);
                        await classDB
                            .doc(startDocId)
                            .update({ class: toDoArray.sort() });
                    }
                })
                .catch((error) => {
                    classDB.doc(startDocId).set({ class: [startDate] });
                });
            Alert.alert("Success", "Create new class", [
                {
                    text: "OK",
                    onPress: () => {
                        setModalNewClass(false);
                        setClientName("");
                        setSearchButton(false);
                        setRefresh(!refresh);
                    },
                },
            ]);
        } else {
            Alert.alert("Failure", "Input Client Info");
        }
    };

    const getClassDate = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return year + ". " + month + ". " + day + ".";
    };

    const getClassTime = (date) => {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? "오후 " : "오전 ";
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? "0" + minutes : minutes;
        return ampm + hours + ":" + minutes;
    };

    const searchClients = async () => {
        let users = [];
        if (clientName !== "" && clientPhone !== "") {
            (
                await db
                    .collection("users")
                    .where("name", "==", clientName)
                    .where("phoneNumber", "==", clientPhone)
                    .get()
            ).forEach((doc) => {
                users.push(doc.data());
            });
        } else if (clientName !== "") {
            (
                await db
                    .collection("users")
                    .where("name", "==", clientName)
                    .get()
            ).forEach((doc) => {
                users.push(doc.data());
            });
        } else if (clientPhone !== "") {
            (
                await db
                    .collection("users")
                    .where("phoneNumber", "==", clientPhone)
                    .get()
            ).forEach((doc) => {
                users.push(doc.data());
            });
        }
        setFindClients(users);
    };

    return (
        <>
            {isLoading ? (
                <View
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Image
                        style={{ width: 50, height: 50 }}
                        source={require("../../assets/loading.gif")}
                    />
                </View>
            ) : (
                <SafeAreaView>{render}</SafeAreaView>
            )}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                    setRefresh(!refresh);
                }}
                style={[styles.floatButton, styles.refreshButton]}
            >
                <MaterialIcons name="refresh" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                    setClassStartDate(new Date());
                    setClassEndDate(new Date());
                    setNameInput(true);
                    setPhoneInput(true);
                    setModalNewClass(true);
                }}
                style={[styles.floatButton, styles.addButton]}
            >
                <AntDesign name="plus" size={24} color="white" />
            </TouchableOpacity>
            <Modal //일정 추가 modal
                animationType="slide"
                visible={modalNewClass}
                transparent={true}
            >
                <SafeAreaView
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                        justifyContent: "center",
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
                            setModalNewClass(false);
                            setClientName("");
                            setClientPhone("");
                            setSearchButton(false);
                        }}
                    >
                        <Text style={{ fontSize: 17 }}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => {
                            Keyboard.dismiss();
                            setShowStartPicker(false);
                            setShowEndPicker(false);
                        }}
                        accessible={false}
                        activeOpacity={1}
                    >
                        <View style={{ flex: 1 }} />
                        <View style={{ flex: 8, paddingHorizontal: 20 }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    marginBottom: 20,
                                }}
                            >
                                <View style={{ flex: 3 }}>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            marginBottom: 3,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flex: 1,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginRight: 3,
                                            }}
                                        >
                                            <Text>Client Name</Text>
                                        </View>
                                        <View style={{ flex: 3 }}>
                                            <TextInput
                                                style={[
                                                    AuthStyles.textInput,
                                                    nameInput
                                                        ? undefined
                                                        : {
                                                              backgroundColor:
                                                                  "#cccccc",
                                                          },
                                                ]}
                                                value={clientName}
                                                onChangeText={setClientName}
                                                editable={nameInput}
                                            />
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                        }}
                                    >
                                        <View
                                            style={{
                                                flex: 1,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginRight: 3,
                                            }}
                                        >
                                            <Text>Phone Number</Text>
                                        </View>
                                        <View style={{ flex: 3 }}>
                                            <TextInput
                                                style={[
                                                    AuthStyles.textInput,
                                                    phoneInput
                                                        ? undefined
                                                        : {
                                                              backgroundColor:
                                                                  "#cccccc",
                                                          },
                                                ]}
                                                value={clientPhone}
                                                onChangeText={setClientPhone}
                                                editable={phoneInput}
                                            />
                                        </View>
                                    </View>
                                </View>
                                <View style={{ flex: 1, paddingLeft: 5 }}>
                                    <TouchableOpacity
                                        style={[
                                            MyStyles.buttonShadow,
                                            {
                                                flex: 1,
                                                borderRadius: 10,
                                                alignItems: "center",
                                                justifyContent: "center",
                                            },
                                        ]}
                                        onPress={() => {
                                            setNameInput(false);
                                            setPhoneInput(false);
                                            setModalNewClass(false);
                                            searchClients();
                                            setModalSearchClient(true);
                                        }}
                                        disabled={searchButton}
                                    >
                                        <Text>Search</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View
                                style={{
                                    flexDirection: "row",
                                    marginBottom: 20,
                                }}
                            >
                                <View style={{ flex: 1, alignItems: "center" }}>
                                    <Text>Start:</Text>
                                </View>
                                <View style={{ flex: 2, alignItems: "center" }}>
                                    <TouchableOpacity
                                        onPress={showDateStartPicker}
                                    >
                                        <Text style={AuthStyles.authText}>
                                            {getClassDate(classStartDate)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 2, alignItems: "center" }}>
                                    <TouchableOpacity
                                        onPress={showTimeStartPicker}
                                    >
                                        <Text style={AuthStyles.authText}>
                                            {getClassTime(classStartDate)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <DateTimePickerModal
                                isVisible={showStartPicker}
                                mode={pickerMode}
                                date={classStartDate}
                                onConfirm={startPickerOnChange}
                                onCancel={() => setShowStartPicker(false)}
                                isDarkModeEnabled={true}
                            />
                            <View
                                style={{
                                    flexDirection: "row",
                                    marginBottom: 20,
                                }}
                            >
                                <View style={{ flex: 1, alignItems: "center" }}>
                                    <Text>End:</Text>
                                </View>
                                <View style={{ flex: 2, alignItems: "center" }}>
                                    <TouchableOpacity
                                        onPress={showDateEndPicker}
                                    >
                                        <Text style={AuthStyles.authText}>
                                            {getClassDate(classEndDate)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 2, alignItems: "center" }}>
                                    <TouchableOpacity
                                        onPress={showTimeEndPicker}
                                    >
                                        <Text style={AuthStyles.authText}>
                                            {getClassTime(classEndDate)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <DateTimePickerModal
                                isVisible={showEndPicker}
                                mode={pickerMode}
                                date={classEndDate}
                                onConfirm={endPickerOnChange}
                                onCancel={() => setShowEndPicker(false)}
                                isDarkModeEnabled={true}
                            />
                            <TouchableOpacity
                                style={[
                                    MyStyles.buttonShadow,
                                    {
                                        aspectRatio: 6,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    },
                                ]}
                                onPress={createNewClass}
                            >
                                <Text>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
            <Modal //고객 찾는 modal
                animationType="slide"
                visible={modalSearchClient}
                transparent={true}
            >
                <SafeAreaView
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                        justifyContent: "center",
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
                            setModalSearchClient(false);
                            setModalNewClass(true);
                        }}
                    >
                        <Text style={{ fontSize: 17 }}>Close</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                    <View style={{ flex: 10, paddingHorizontal: 20 }}>
                        <Text style={{ paddingLeft: 5 }}>Select Client</Text>
                        <FlatList
                            data={findClients}
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
                                            setClientName(item.name);
                                            setClientPhone(item.phoneNumber);
                                            setSearchButton(true);
                                            setModalSearchClient(false);
                                            setModalNewClass(true);
                                        }}
                                    >
                                        <Text>{item.name}</Text>
                                        <Text>{item.phoneNumber}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            numColumns={3}
                            keyExtractor={(item, index) => index}
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </>
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
    event: {
        flex: 1,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
    },
    eventDuration: {
        width: "30%",
        justifyContent: "center",
    },
    durationContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    durationDot: {
        width: 4,
        height: 4,
        backgroundColor: "grey",
        marginRight: 5,
        alignSelf: "center",
        borderRadius: 4 / 2,
    },
    durationDotConnector: {
        height: 20,
        borderLeftColor: "grey",
        borderLeftWidth: StyleSheet.hairlineWidth,
        position: "absolute",
        left: 2,
    },
    durationText: {
        color: "grey",
        fontSize: 12,
    },
    eventNote: {},
    lineSeparator: {
        width: "100%",
        borderBottomColor: "lightgrey",
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    floatButton: {
        position: "absolute",
        width: 50,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#d9d9d9",
        borderRadius: 50,
        ...Platform.select({
            ios: {
                shadowColor: "#c6c6c6",
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 5,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    addButton: {
        right: 30,
        bottom: 30,
        backgroundColor: "#66d9ff",
    },
    refreshButton: {
        right: 30,
        bottom: 90,
        backgroundColor: "white",
    },
});
