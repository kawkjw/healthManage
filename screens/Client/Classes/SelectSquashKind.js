import React from "react";
import { Alert, View, Text, TouchableOpacity } from "react-native";
import { Surface } from "react-native-paper";
import { MyStyles, TextSize } from "../../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default SelectSquashKind = ({ navigation, route }) => {
    const { availPt, availGroup } = route.params;

    return (
        <View style={MyStyles.container}>
            <View style={{ flex: 1, marginTop: 20 }}>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => {
                            if (availPt) {
                                navigation.navigate("PT", {
                                    ptName: "squash",
                                    trainerName: route.params.trainerName,
                                    trainerUid: route.params.trainerUid,
                                });
                            } else {
                                Alert.alert(
                                    "경고",
                                    "스쿼시 개인 수업권이 없습니다.",
                                    [{ text: "확인" }],
                                    {
                                        cancelable: false,
                                    }
                                );
                            }
                        }}
                    >
                        <Text
                            style={[
                                TextSize.largeSize,
                                availPt === false ? { color: "red" } : { color: "black" },
                            ]}
                        >
                            개인 수업
                        </Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => {
                            if (availGroup) {
                                navigation.navigate("SelectDate", {
                                    classname: "squash",
                                    week: 2,
                                });
                            } else {
                                Alert.alert(
                                    "경고",
                                    "스쿼시 단체 수업권이 없습니다.",
                                    [{ text: "확인" }],
                                    {
                                        cancelable: false,
                                    }
                                );
                            }
                        }}
                    >
                        <Text
                            style={[
                                TextSize.largeSize,
                                availGroup === false ? { color: "red" } : { color: "black" },
                            ]}
                        >
                            그룹 수업
                        </Text>
                    </TouchableOpacity>
                </Surface>
            </View>
            <View style={{ backgroundColor: "#3366cc", height: hp("6%"), width: "100%" }} />
        </View>
    );
};
