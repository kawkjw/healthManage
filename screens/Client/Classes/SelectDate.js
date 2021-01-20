import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { getStatusBarHeight } from "react-native-status-bar-height";
import { MyStyles } from "../../../css/MyStyles";
import myBase, { arrayUnion, db } from "../../../config/MyBase";

export default SelectDate = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const { classname, date } = route.params;
    const [data, setData] = useState([]);
    const [modalClass, setModalClass] = useState(false);
    const [selectDate, setSelectDate] = useState(0);
    const [classList, setClassList] = useState([]);

    useEffect(() => {
        const showCalendar = async () => {
            let items = [
                { id: "일", color: "red", pressable: false, isHeader: true },
                { id: "월", color: "black", pressable: false, isHeader: true },
                { id: "화", color: "black", pressable: false, isHeader: true },
                { id: "수", color: "black", pressable: false, isHeader: true },
                { id: "목", color: "black", pressable: false, isHeader: true },
                { id: "금", color: "black", pressable: false, isHeader: true },
                { id: "토", color: "blue", pressable: false, isHeader: true },
            ];
            const firstDate = new Date(date + "-01");
            for (let i = 0; i < firstDate.getDay(); i++) {
                items.push({ id: " ", pressable: false, isHeader: true });
            }
            let classDate = [];
            await db
                .collection("classes")
                .doc(classname)
                .collection("class")
                .doc(date)
                .get()
                .then((snapshot) => {
                    if (snapshot.exists) {
                        classDate = snapshot.data().class;
                    }
                });
            classDate.push("-1");
            let index = 0;
            const endDate = new Date(date.split("-")[0], date.split("-")[1], 0);
            for (let i = 1; i <= endDate.getDate(); i++) {
                const d = new Date(date + "-" + (i < 10 ? "0" + i : i));
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
    }, []);

    useEffect(() => {
        const getClass = async () => {
            let list = [];
            await db
                .collection("classes")
                .doc(classname)
                .collection("class")
                .doc(date)
                .collection(selectDate.toString())
                .orderBy("start", "asc")
                .get()
                .then((snapshots) => {
                    snapshots.forEach((snapshot) => {
                        let c = {};
                        const data = snapshot.data();
                        const start = data.start.toDate();
                        const end = data.end.toDate();
                        c["cid"] = snapshot.id;
                        c["trainer"] = data.trainer;
                        c["currentClient"] = data.currentClient;
                        c["maxClient"] = data.maxClient;
                        c["start"] =
                            (start.getHours() < 10
                                ? "0" + start.getHours()
                                : start.getHours()) +
                            ":" +
                            (start.getMinutes() === 0
                                ? "00"
                                : start.getMinutes());
                        c["end"] =
                            (end.getHours() < 10
                                ? "0" + end.getHours()
                                : end.getHours()) +
                            ":" +
                            (end.getMinutes() === 0 ? "00" : end.getMinutes());
                        list.push(c);
                    });
                });
            setClassList(list);
        };
        if (selectDate !== 0) {
            getClass();
        } else {
            setClassList([]);
        }
    }, [selectDate]);

    const reserveClass = async (cid) => {
        const classInDB = db
            .collection("classes")
            .doc(classname)
            .collection("class")
            .doc(date)
            .collection(selectDate.toString())
            .doc(cid);
        const { currentClient, maxClient, start, end, trainer } = (
            await classInDB.get()
        ).data();
        if (currentClient >= maxClient) {
            Alert.alert("Error", "Full Class", [
                {
                    text: "OK",
                    onPress: () => {
                        setModalClass(false);
                    },
                },
            ]);
        } else {
            const { name, phoneNumber, uid } = (
                await db
                    .collection("users")
                    .doc(myBase.auth().currentUser.uid)
                    .get()
            ).data();
            await classInDB
                .collection("clients")
                .where("uid", "==", uid)
                .limit(1)
                .get()
                .then(async (clients) => {
                    if (clients.size === 0) {
                        await classInDB.collection("clients").doc(uid).set({
                            uid: uid,
                            name: name,
                            phoneNumber: phoneNumber,
                        });
                        await classInDB.update({
                            currentClient: currentClient + 1,
                        });
                        await db
                            .collection("users")
                            .doc(myBase.auth().currentUser.uid)
                            .collection("reservation")
                            .doc(date)
                            .collection(selectDate.toString())
                            .doc(cid)
                            .set({
                                classId: cid,
                                start: start,
                                end: end,
                                trainer: trainer,
                                className: classname,
                            });
                        await db
                            .collection("users")
                            .doc(myBase.auth().currentUser.uid)
                            .collection("reservation")
                            .doc(date)
                            .update({
                                date: arrayUnion(selectDate.toString()),
                            });
                        Alert.alert("Success", "Reserved Class", [
                            {
                                text: "OK",
                                onPress: () => {
                                    navigation.replace("HomeScreen");
                                },
                            },
                        ]);
                    } else {
                        clients.forEach((client) => {
                            if (client.exists) {
                                Alert.alert("Error", "Already Reserved", [
                                    {
                                        text: "OK",
                                        onPress: () => {
                                            setModalClass(false);
                                            setSelectDate(0);
                                        },
                                    },
                                ]);
                            }
                        });
                    }
                });
        }
    };

    return (
        <SafeAreaView>
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
                                setModalClass(item.pressable);
                                setSelectDate(Number(item.id));
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
            <Modal
                animationType="slide"
                visible={modalClass}
                //transparent={true}
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
                            setModalClass(false);
                            setSelectDate(0);
                        }}
                    >
                        <Text style={{ fontSize: 17 }}>Close</Text>
                    </TouchableOpacity>
                    <View style={{ height: 30 }}></View>
                    <ScrollView
                        style={{
                            flex: 10,
                            paddingTop: 20,
                            alignSelf: "stretch",
                        }}
                        contentContainerStyle={{ alignItems: "center" }}
                    >
                        {classList.map((c, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    MyStyles.phoneButton,
                                    MyStyles.buttonShadow,
                                    { width: widthButton, marginBottom: 20 },
                                ]}
                                onPress={() => {
                                    Alert.alert(
                                        selectDate.toString() +
                                            "일 " +
                                            c.start +
                                            "~" +
                                            c.end,
                                        "Are you sure?",
                                        [
                                            { text: "Cancel" },
                                            {
                                                text: "OK",
                                                onPress: () =>
                                                    reserveClass(c.cid),
                                            },
                                        ]
                                    );
                                }}
                            >
                                <Text>
                                    {selectDate}일 {c.start}~{c.end} (
                                    {c.currentClient}/{c.maxClient})
                                </Text>
                                <Text>트레이너 : {c.trainer}</Text>
                            </TouchableOpacity>
                        ))}
                        {classList.length === 0 ? (
                            <Text>No Class</Text>
                        ) : undefined}
                    </ScrollView>
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
});
