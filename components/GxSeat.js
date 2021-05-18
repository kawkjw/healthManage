import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Surface } from "react-native-paper";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { db } from "../config/MyBase";
import { TextSize } from "../css/MyStyles";

export default GxSeat = ({
    permit = "client",
    clientList = Array(28).fill(0),
    onPress = () => {},
    cid = "",
}) => {
    const [brokenSeats, setBrokenSeats] = useState(Array(28).fill(true));

    const getBrokenSeats = async () => {
        await db
            .collection("classes")
            .doc("spinning")
            .get()
            .then((doc) => {
                const data = doc.data();
                if (data.seatAvailability !== undefined) {
                    return data.seatAvailability;
                } else {
                    return Array(28).fill(false);
                }
            })
            .then((seats) => {
                setBrokenSeats(seats);
            });
    };

    useEffect(() => {
        getBrokenSeats();
    }, []);

    const renderForClient = (start, end) => {
        const num = end - start + 1;
        const arr = Array(num)
            .fill(start)
            .map((v, i) => v + i);
        return arr.map((n, index) => (
            <Surface key={index} style={styles.elemView}>
                <TouchableOpacity
                    style={[
                        styles.button,
                        brokenSeats[n - 1]
                            ? clientList[n - 1] === 1 && { backgroundColor: "lightgrey" }
                            : { backgroundColor: "red" },
                        brokenSeats[n - 1]
                            ? clientList[n - 1] === 2 && { backgroundColor: "lightskyblue" }
                            : { backgroundColor: "red" },
                    ]}
                    onPress={() => {
                        Alert.alert(
                            `${n}번 자리`,
                            "확실합니까?",
                            [{ text: "취소" }, { text: "확인", onPress: () => onPress(cid, n) }],
                            { cancelable: false }
                        );
                    }}
                    disabled={clientList[n - 1] !== 0 || brokenSeats[n - 1] === false}
                >
                    <Text style={TextSize.normalSize}>{n}</Text>
                    {clientList[n - 1] === 2 && <Text style={TextSize.smallSize}>나</Text>}
                </TouchableOpacity>
            </Surface>
        ));
    };

    const renderForTrainer = (start, end) => {
        const num = end - start + 1;
        const arr = Array(num)
            .fill(start)
            .map((v, i) => v + i);
        return arr.map((n, index) => {
            const idx = clientList.findIndex((client) => client.num === n);
            if (idx >= 0) {
                return (
                    <Surface
                        key={index}
                        style={[
                            styles.elemView,
                            brokenSeats[n - 1]
                                ? { backgroundColor: "lightskyblue" }
                                : { backgroundColor: "red" },
                        ]}
                    >
                        <Text style={TextSize.normalSize}>{n}</Text>
                        <Text style={TextSize.smallSize}>{clientList[idx].name}</Text>
                    </Surface>
                );
            }
            return (
                <Surface
                    key={index}
                    style={[
                        styles.elemView,
                        brokenSeats[n - 1] === false && { backgroundColor: "red" },
                    ]}
                >
                    <Text style={TextSize.normalSize}>{n}</Text>
                </Surface>
            );
        });
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.rowView}>
                <View style={{ flex: 2 }} />
                <Surface style={[styles.elemView, { flex: 2 }]}>
                    <Text style={TextSize.normalSize}>강사</Text>
                </Surface>
                <View style={{ flex: 2 }} />
            </View>
            <View style={styles.rowView}>
                {permit === "client" ? renderForClient(1, 6) : renderForTrainer(1, 6)}
            </View>
            <View style={styles.rowView}>
                <View style={styles.blankView} />
                {permit === "client" ? renderForClient(7, 10) : renderForTrainer(7, 10)}
                <View style={styles.blankView} />
            </View>
            <View style={styles.rowView}>
                {permit === "client" ? renderForClient(11, 16) : renderForTrainer(11, 16)}
            </View>
            <View style={[styles.rowView, { marginHorizontal: 30 }]}>
                {permit === "client" ? renderForClient(17, 21) : renderForTrainer(17, 21)}
            </View>
            <View style={[styles.rowView, { marginHorizontal: 30 }]}>
                {permit === "client" ? renderForClient(22, 26) : renderForTrainer(22, 26)}
            </View>
            <View style={styles.rowView}>
                <View style={styles.blankView} />
                <View style={styles.blankView} />
                {permit === "client" ? renderForClient(27, 28) : renderForTrainer(27, 28)}
                <View style={styles.blankView} />
                <View style={styles.blankView} />
            </View>
            <View style={{ height: hp("10%") }} />
        </View>
    );
};

const styles = StyleSheet.create({
    rowView: {
        flex: 1,
        alignItems: "center",
        flexDirection: "row",
    },
    elemView: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        height: hp("6%"),
        margin: 10,
        elevation: 6,
        borderRadius: 10,
    },
    blankView: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        margin: 10,
    },
    button: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "stretch",
        borderRadius: 10,
    },
});
