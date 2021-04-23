import React, { useEffect, useState } from "react";
import { View, Text, Keyboard, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Button, RadioButton, Surface, TextInput } from "react-native-paper";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default Calculator = ({ navigation, route }) => {
    const [sexSelected, setSexSelected] = useState(-1);
    const [clientHeights, setClientHeights] = useState("");
    const [clientWeights, setClientWeights] = useState("");
    const [clientAge, setClientAge] = useState("");
    const [result, setResult] = useState({
        standardWeights: 0,
        obesity: 0,
        bmi: 0,
        bmr: 0,
    });

    useEffect(() => {
        if (Number(clientHeights) >= 1000) {
            setClientHeights(clientHeights.slice(0, 3) + "." + clientHeights.slice(3));
        }
    }, [clientHeights]);

    useEffect(() => {
        if (Number(clientWeights) >= 1000) {
            setClientWeights(clientWeights.slice(0, 3) + "." + clientWeights.slice(3, 5));
        }
    }, [clientWeights]);

    useEffect(() => {
        if (sexSelected !== -1) {
            let tStandardWeights = 0;
            let tObesity = 0;
            let tBmi = 0;
            let tBmr = 0;
            if (Number(clientHeights) >= 100) {
                tStandardWeights =
                    sexSelected === 0
                        ? Number(((Number(clientHeights) - 100) * 0.9).toFixed(2))
                        : Number(((Number(clientHeights) - 100) * 0.85).toFixed(2));
            }
            if (Number(clientWeights) >= 10) {
                tObesity = Number(((Number(clientWeights) / tStandardWeights) * 100).toFixed(2));
                tBmi = Number(
                    (Number(clientWeights) / Math.pow(Number(clientHeights) * 0.01, 2)).toFixed(2)
                );
            }
            if (Number(clientAge) >= 10) {
                tBmr =
                    sexSelected === 0
                        ? Math.floor(
                              66.47 +
                                  (13.75 * Number(clientWeights) +
                                      (5 * Number(clientHeights) - 6.76 * Number(clientAge)))
                          )
                        : Math.floor(
                              665.1 +
                                  (9.56 * Number(clientWeights) +
                                      (1.85 * Number(clientHeights) - 4.68 * Number(clientAge)))
                          );
            }
            setResult({
                standardWeights: tStandardWeights,
                obesity: tObesity,
                bmi: tBmi,
                bmr: tBmr,
            });
        }
    }, [sexSelected, clientHeights, clientWeights, clientAge]);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView>
                <TouchableOpacity
                    style={{ height: hp("90%"), paddingHorizontal: 10 }}
                    onPress={Keyboard.dismiss}
                    accessible={false}
                    activeOpacity={1}
                >
                    <Surface style={[MyStyles.surface, { marginTop: 10 }]}>
                        <View style={{ padding: 10, paddingRight: 20, paddingBottom: 20 }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    height: hp("5.5%"),
                                    alignItems: "center",
                                }}
                            >
                                <View
                                    style={{
                                        flex: 1,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Text style={[TextSize.normalSize, { fontWeight: "bold" }]}>
                                        성별
                                    </Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <RadioButton.Group
                                        onValueChange={(value) => setSexSelected(value)}
                                        value={sexSelected}
                                    >
                                        <View
                                            style={{ flexDirection: "row", alignItems: "center" }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <RadioButton.Android value={0} color="#374862" />
                                                <Button
                                                    mode="text"
                                                    onPress={() => setSexSelected(0)}
                                                    labelStyle={{
                                                        marginHorizontal: 5,
                                                        marginVertical: 5,
                                                    }}
                                                    compact={true}
                                                >
                                                    남
                                                </Button>
                                            </View>
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <RadioButton.Android value={1} color="#374862" />
                                                <Button
                                                    mode="text"
                                                    onPress={() => setSexSelected(1)}
                                                    labelStyle={{
                                                        marginHorizontal: 5,
                                                        marginVertical: 5,
                                                    }}
                                                    compact={true}
                                                >
                                                    여
                                                </Button>
                                            </View>
                                        </View>
                                    </RadioButton.Group>
                                </View>
                            </View>
                            <View style={{ flexDirection: "row" }}>
                                <View
                                    style={{
                                        flex: 1,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Text style={[TextSize.normalSize, { fontWeight: "bold" }]}>
                                        키
                                    </Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <TextInput
                                        label="키(cm)"
                                        mode="outlined"
                                        placeholder="000.0"
                                        dense={true}
                                        keyboardType="decimal-pad"
                                        value={clientHeights}
                                        maxLength={5}
                                        onChangeText={setClientHeights}
                                        right={<TextInput.Affix text="cm" />}
                                    />
                                </View>
                            </View>
                            <View style={{ flexDirection: "row" }}>
                                <View
                                    style={{
                                        flex: 1,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Text style={[TextSize.normalSize, { fontWeight: "bold" }]}>
                                        몸무게
                                    </Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <TextInput
                                        label="몸무게(kg)"
                                        mode="outlined"
                                        placeholder="0.00"
                                        dense={true}
                                        keyboardType="decimal-pad"
                                        value={clientWeights}
                                        maxLength={6}
                                        onChangeText={setClientWeights}
                                        right={<TextInput.Affix text="kg" />}
                                    />
                                </View>
                            </View>
                            <View style={{ flexDirection: "row" }}>
                                <View
                                    style={{
                                        flex: 1,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Text style={[TextSize.normalSize, { fontWeight: "bold" }]}>
                                        나이
                                    </Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <TextInput
                                        label="나이"
                                        mode="outlined"
                                        placeholder="00"
                                        dense={true}
                                        keyboardType="decimal-pad"
                                        value={clientAge}
                                        maxLength={3}
                                        onChangeText={setClientAge}
                                        right={<TextInput.Affix text="세" />}
                                    />
                                </View>
                            </View>
                        </View>
                    </Surface>
                    <Surface style={MyStyles.surface}>
                        <View style={{ padding: 10 }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    height: hp("3%"),
                                    alignItems: "center",
                                }}
                            >
                                <View style={{ flex: 1, alignItems: "flex-end" }}>
                                    <Text
                                        style={[
                                            TextSize.normalSize,
                                            { fontWeight: "bold", paddingRight: 10 },
                                        ]}
                                    >
                                        표준체중
                                    </Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={TextSize.normalSize}>
                                        {result.standardWeights} kg
                                    </Text>
                                </View>
                            </View>
                            <View
                                style={{
                                    flexDirection: "row",
                                    height: hp("3%"),
                                    alignItems: "center",
                                }}
                            >
                                <View style={{ flex: 1, alignItems: "flex-end" }}>
                                    <Text
                                        style={[
                                            TextSize.normalSize,
                                            { fontWeight: "bold", paddingRight: 10 },
                                        ]}
                                    >
                                        비만도(%)
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={TextSize.normalSize}>{result.obesity} %</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    {result.obesity !== 0 ? (
                                        <Text
                                            style={[
                                                TextSize.largeSize,
                                                result.obesity >= 140
                                                    ? { color: "red" }
                                                    : result.obesity >= 120
                                                    ? { color: "deeppink" }
                                                    : result.obesity >= 110
                                                    ? { color: "orange" }
                                                    : result.obesity >= 90
                                                    ? { color: "green" }
                                                    : { color: "deepskyblue" },
                                            ]}
                                        >
                                            {result.obesity >= 140
                                                ? "고도비만"
                                                : result.obesity >= 120
                                                ? "비만"
                                                : result.obesity >= 110
                                                ? "과체중"
                                                : result.obesity >= 90
                                                ? "정상체중"
                                                : "저체중"}
                                        </Text>
                                    ) : undefined}
                                </View>
                            </View>
                            <View
                                style={{
                                    flexDirection: "row",
                                    height: hp("3%"),
                                    alignItems: "center",
                                }}
                            >
                                <View style={{ flex: 1, alignItems: "flex-end" }}>
                                    <Text
                                        style={[
                                            TextSize.normalSize,
                                            { fontWeight: "bold", paddingRight: 10 },
                                        ]}
                                    >
                                        BMI(신체질량지수)
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={TextSize.normalSize}>
                                        {result.bmi} kg/m{"\xB2"}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    {result.bmi !== 0 ? (
                                        <Text
                                            style={[
                                                TextSize.largeSize,
                                                result.bmi >= 30
                                                    ? { color: "red" }
                                                    : result.bmi >= 25
                                                    ? { color: "deeppink" }
                                                    : result.bmi >= 23
                                                    ? { color: "orange" }
                                                    : result.bmi >= 18.5
                                                    ? { color: "green" }
                                                    : { color: "deepskyblue" },
                                            ]}
                                        >
                                            {result.bmi >= 30
                                                ? "고도비만"
                                                : result.bmi >= 25
                                                ? "비만"
                                                : result.bmi >= 23
                                                ? "과체중"
                                                : result.bmi >= 18.5
                                                ? "정상체중"
                                                : "저체중"}
                                        </Text>
                                    ) : undefined}
                                </View>
                            </View>
                            <View
                                style={{
                                    flexDirection: "row",
                                    height: hp("3%"),
                                    alignItems: "center",
                                }}
                            >
                                <View style={{ flex: 1, alignItems: "flex-end" }}>
                                    <Text
                                        style={[
                                            TextSize.normalSize,
                                            { fontWeight: "bold", paddingRight: 10 },
                                        ]}
                                    >
                                        기초대사량
                                    </Text>
                                </View>
                                <View style={{ flex: 2 }}>
                                    <Text style={TextSize.normalSize}>{result.bmr} kcal</Text>
                                </View>
                            </View>
                        </View>
                    </Surface>
                    <Surface style={MyStyles.surface}>
                        <View style={{ padding: 10 }}>
                            <View style={{ flexDirection: "row" }}>
                                <View style={{ flex: 1 }}>
                                    <View style={[styles.marginBottom5, { alignItems: "center" }]}>
                                        <Text style={[TextSize.normalSize, { fontWeight: "bold" }]}>
                                            브로카지수 구분
                                        </Text>
                                    </View>
                                    <View style={[styles.marginBottom5, { flexDirection: "row" }]}>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>저체중</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>90 이하</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.marginBottom5, { flexDirection: "row" }]}>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>정상체중</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>90 ~ 110</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.marginBottom5, { flexDirection: "row" }]}>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>과체중</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>110 ~ 120</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.marginBottom5, { flexDirection: "row" }]}>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>비만</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>120 ~ 140</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.marginBottom5, { flexDirection: "row" }]}>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>고도비만</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>140 이상</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={{ borderRightWidth: 1, borderRightColor: "grey" }} />
                                <View style={{ flex: 1 }}>
                                    <View style={[styles.marginBottom5, { alignItems: "center" }]}>
                                        <Text style={[TextSize.normalSize, { fontWeight: "bold" }]}>
                                            BMI 지수 구분
                                        </Text>
                                    </View>
                                    <View style={[styles.marginBottom5, { flexDirection: "row" }]}>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>저체중</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>18.5 이하</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.marginBottom5, { flexDirection: "row" }]}>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>정상체중</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>18.5 ~ 22.9</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.marginBottom5, { flexDirection: "row" }]}>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>과체중</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>23 ~ 24.9</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.marginBottom5, { flexDirection: "row" }]}>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>비만</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>25 ~ 29.9</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.marginBottom5, { flexDirection: "row" }]}>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>고도비만</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <Text style={[TextSize.normalSize]}>30 ~ 39.9</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Surface>
                </TouchableOpacity>
            </ScrollView>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    marginBottom5: {
        marginBottom: 5,
    },
});
