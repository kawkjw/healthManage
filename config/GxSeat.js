import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Surface } from "react-native-paper";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { TextSize } from "../css/MyStyles";

export default GxSeat = ({
    permit = "client",
    clientList = Array(28).fill(0),
    onPress = () => {},
    cid = "",
}) => {
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
                        style={[styles.elemView, { backgroundColor: "lightskyblue" }]}
                    >
                        <Text style={TextSize.normalSize}>{n}</Text>
                        <Text style={TextSize.smallSize}>{clientList[idx].name}</Text>
                    </Surface>
                );
            }
            return (
                <Surface key={index} style={styles.elemView}>
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
                {permit === "client"
                    ? clientList.slice(0, 6).map((v, i) => (
                          <Surface key={i} style={styles.elemView}>
                              <TouchableOpacity
                                  style={[
                                      styles.button,
                                      v === 1 && { backgroundColor: "lightgrey" },
                                      v === 2 && { backgroundColor: "lightskyblue" },
                                  ]}
                                  onPress={() => {
                                      Alert.alert(
                                          `${i + 1}번 자리`,
                                          "확실합니까?",
                                          [
                                              { text: "취소" },
                                              { text: "확인", onPress: () => onPress(cid, i + 1) },
                                          ],
                                          { cancelable: false }
                                      );
                                  }}
                                  disabled={v !== 0}
                              >
                                  <Text style={TextSize.normalSize}>{i + 1}</Text>
                                  {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                              </TouchableOpacity>
                          </Surface>
                      ))
                    : renderForTrainer(1, 6)}
            </View>
            <View style={styles.rowView}>
                <View style={styles.blankView} />
                {permit === "client"
                    ? clientList.slice(6, 10).map((v, i) => (
                          <Surface key={i} style={styles.elemView}>
                              <TouchableOpacity
                                  style={[
                                      styles.button,
                                      v === 1 && { backgroundColor: "lightgrey" },
                                      v === 2 && { backgroundColor: "lightskyblue" },
                                  ]}
                                  onPress={() => {
                                      Alert.alert(
                                          `${i + 7}번 자리`,
                                          "확실합니까?",
                                          [
                                              { text: "취소" },
                                              { text: "확인", onPress: () => onPress(cid, i + 7) },
                                          ],
                                          { cancelable: false }
                                      );
                                  }}
                                  disabled={v !== 0}
                              >
                                  <Text style={TextSize.normalSize}>{i + 7}</Text>
                                  {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                              </TouchableOpacity>
                          </Surface>
                      ))
                    : renderForTrainer(7, 10)}
                <View style={styles.blankView} />
            </View>
            <View style={styles.rowView}>
                {permit === "client"
                    ? clientList.slice(10, 16).map((v, i) => (
                          <Surface key={i} style={styles.elemView}>
                              <TouchableOpacity
                                  style={[
                                      styles.button,
                                      v === 1 && { backgroundColor: "lightgrey" },
                                      v === 2 && { backgroundColor: "lightskyblue" },
                                  ]}
                                  onPress={() => {
                                      Alert.alert(
                                          `${i + 11}번 자리`,
                                          "확실합니까?",
                                          [
                                              { text: "취소" },
                                              { text: "확인", onPress: () => onPress(cid, i + 11) },
                                          ],
                                          { cancelable: false }
                                      );
                                  }}
                                  disabled={v !== 0}
                              >
                                  <Text style={TextSize.normalSize}>{i + 11}</Text>
                                  {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                              </TouchableOpacity>
                          </Surface>
                      ))
                    : renderForTrainer(11, 16)}
            </View>
            <View style={[styles.rowView, { marginHorizontal: 30 }]}>
                {permit === "client"
                    ? clientList.slice(16, 21).map((v, i) => (
                          <Surface key={i} style={styles.elemView}>
                              <TouchableOpacity
                                  style={[
                                      styles.button,
                                      v === 1 && { backgroundColor: "lightgrey" },
                                      v === 2 && { backgroundColor: "lightskyblue" },
                                  ]}
                                  onPress={() => {
                                      Alert.alert(
                                          `${i + 17}번 자리`,
                                          "확실합니까?",
                                          [
                                              { text: "취소" },
                                              { text: "확인", onPress: () => onPress(cid, i + 17) },
                                          ],
                                          { cancelable: false }
                                      );
                                  }}
                                  disabled={v !== 0}
                              >
                                  <Text style={TextSize.normalSize}>{i + 17}</Text>
                                  {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                              </TouchableOpacity>
                          </Surface>
                      ))
                    : renderForTrainer(17, 21)}
            </View>
            <View style={[styles.rowView, { marginHorizontal: 30 }]}>
                {permit === "client"
                    ? clientList.slice(21, 26).map((v, i) => (
                          <Surface key={i} style={styles.elemView}>
                              <TouchableOpacity
                                  style={[
                                      styles.button,
                                      v === 1 && { backgroundColor: "lightgrey" },
                                      v === 2 && { backgroundColor: "lightskyblue" },
                                  ]}
                                  onPress={() => {
                                      Alert.alert(
                                          `${i + 22}번 자리`,
                                          "확실합니까?",
                                          [
                                              { text: "취소" },
                                              { text: "확인", onPress: () => onPress(cid, i + 22) },
                                          ],
                                          { cancelable: false }
                                      );
                                  }}
                                  disabled={v !== 0}
                              >
                                  <Text style={TextSize.normalSize}>{i + 22}</Text>
                                  {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                              </TouchableOpacity>
                          </Surface>
                      ))
                    : renderForTrainer(22, 26)}
            </View>
            <View style={styles.rowView}>
                <View style={styles.blankView} />
                <View style={styles.blankView} />
                {permit === "client"
                    ? clientList.slice(26).map((v, i) => (
                          <Surface key={i} style={styles.elemView}>
                              <TouchableOpacity
                                  style={[
                                      styles.button,
                                      v === 1 && { backgroundColor: "lightgrey" },
                                      v === 2 && { backgroundColor: "lightskyblue" },
                                  ]}
                                  onPress={() => {
                                      Alert.alert(
                                          `${i + 27}번 자리`,
                                          "확실합니까?",
                                          [
                                              { text: "취소" },
                                              { text: "확인", onPress: () => onPress(cid, i + 27) },
                                          ],
                                          { cancelable: false }
                                      );
                                  }}
                                  disabled={v !== 0}
                              >
                                  <Text style={TextSize.normalSize}>{i + 27}</Text>
                                  {v === 2 && <Text style={TextSize.smallSize}>나</Text>}
                              </TouchableOpacity>
                          </Surface>
                      ))
                    : renderForTrainer(27, 28)}
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
