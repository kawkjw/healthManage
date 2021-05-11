import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Surface } from "react-native-paper";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { TextSize } from "../css/MyStyles";

export default GxSeat = ({
    permit = "client",
    clientList = Array(28).fill(0),
    onPress = () => {},
    cid = "",
}) => {
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
                {clientList.slice(0, 6).map((v, i) => (
                    <Surface key={i} style={styles.elemView}>
                        <TouchableOpacity
                            style={[styles.button, v !== 0 && { backgroundColor: "red" }]}
                            onPress={() => onPress(cid, i + 1)}
                            disabled={permit === "trainer" || v !== 0}
                        >
                            <Text style={TextSize.normalSize}>{i + 1}</Text>
                            {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                        </TouchableOpacity>
                    </Surface>
                ))}
            </View>
            <View style={styles.rowView}>
                <View style={styles.blankView} />
                {clientList.slice(6, 10).map((v, i) => (
                    <Surface key={i} style={styles.elemView}>
                        <TouchableOpacity
                            style={[styles.button, v !== 0 && { backgroundColor: "red" }]}
                            onPress={() => onPress(cid, i + 7)}
                            disabled={permit === "trainer" || v !== 0}
                        >
                            <Text style={TextSize.normalSize}>{i + 7}</Text>
                            {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                        </TouchableOpacity>
                    </Surface>
                ))}
                <View style={styles.blankView} />
            </View>
            <View style={styles.rowView}>
                {clientList.slice(10, 16).map((v, i) => (
                    <Surface key={i} style={styles.elemView}>
                        <TouchableOpacity
                            style={[styles.button, v !== 0 && { backgroundColor: "red" }]}
                            onPress={() => onPress(cid, i + 11)}
                            disabled={permit === "trainer" || v !== 0}
                        >
                            <Text style={TextSize.normalSize}>{i + 11}</Text>
                            {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                        </TouchableOpacity>
                    </Surface>
                ))}
            </View>
            <View style={[styles.rowView, { marginHorizontal: 30 }]}>
                {clientList.slice(16, 21).map((v, i) => (
                    <Surface key={i} style={styles.elemView}>
                        <TouchableOpacity
                            style={[styles.button, v !== 0 && { backgroundColor: "red" }]}
                            onPress={() => nPress(cid, i + 17)}
                            disabled={permit === "trainer" || v !== 0}
                        >
                            <Text style={TextSize.normalSize}>{i + 17}</Text>
                            {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                        </TouchableOpacity>
                    </Surface>
                ))}
            </View>
            <View style={[styles.rowView, { marginHorizontal: 30 }]}>
                {clientList.slice(21, 26).map((v, i) => (
                    <Surface key={i} style={styles.elemView}>
                        <TouchableOpacity
                            style={[styles.button, v !== 0 && { backgroundColor: "red" }]}
                            onPress={() => onPress(cid, i + 22)}
                            disabled={permit === "trainer" || v !== 0}
                        >
                            <Text style={TextSize.normalSize}>{i + 22}</Text>
                            {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                        </TouchableOpacity>
                    </Surface>
                ))}
            </View>
            <View style={styles.rowView}>
                <View style={styles.blankView} />
                <View style={styles.blankView} />
                {clientList.slice(26).map((v, i) => (
                    <Surface key={i} style={styles.elemView}>
                        <TouchableOpacity
                            style={[styles.button, v !== 0 && { backgroundColor: "red" }]}
                            onPress={() => onPress(cid, i + 27)}
                            disabled={permit === "trainer" || v !== 0}
                        >
                            <Text style={TextSize.normalSize}>{i + 27}</Text>
                            {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                        </TouchableOpacity>
                    </Surface>
                ))}
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
