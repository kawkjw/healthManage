import React from "react";
import { Alert, View, TouchableOpacity } from "react-native";
import { Surface, Text } from "react-native-paper";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import ToHome from "../../../components/ToHome";

export default SelectSquashKind = ({ navigation, route }) => {
    const { availPt, availGroup, end } = route.params;

    return (
        <View style={MyStyles.container}>
            <ToHome navigation={navigation} />
            <View style={{ flex: 1, marginTop: 20 }}>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => {
                            if (availPt) {
                                if (
                                    route.params.trainerName !== "" &&
                                    route.params.trainerUid !== ""
                                ) {
                                    navigation.navigate("PT", {
                                        ptName: "squash",
                                        trainerName: route.params.trainerName,
                                        trainerUid: route.params.trainerUid,
                                    });
                                } else {
                                    Alert.alert(
                                        "경고",
                                        "담당 트레이너 계정이 삭제되었습니다.\n관리자에게 문의해주세요.",
                                        [{ text: "확인" }],
                                        { cancelable: false }
                                    );
                                }
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
                                    end: end,
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
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
