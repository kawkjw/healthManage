import React from "react";
import { Alert, Dimensions, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { MyStyles, TextSize } from "../../../css/MyStyles";

export default SelectSquashKind = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;
    const { availPt, availGroup } = route.params;

    return (
        <SafeAreaView style={MyStyles.container}>
            <View style={{ height: 20 }} />
            <TouchableOpacity
                style={[
                    MyStyles.phoneButton,
                    MyStyles.buttonShadow,
                    { width: widthButton, marginBottom: 20 },
                ]}
                onPress={() => {
                    if (availPt) {
                        navigation.navigate("PT", {
                            ptName: "squash",
                            trainerName: route.params.trainerName,
                            trainerUid: route.params.trainerUid,
                        });
                    } else {
                        Alert.alert("경고", "스쿼시 개인 수업권이 없습니다.", [{ text: "확인" }]);
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
            <TouchableOpacity
                style={[
                    MyStyles.phoneButton,
                    MyStyles.buttonShadow,
                    { width: widthButton, marginBottom: 20 },
                ]}
                onPress={() => {
                    if (availGroup) {
                        navigation.navigate("SelectDate", {
                            classname: "squash",
                            week: 2,
                        });
                    } else {
                        Alert.alert("경고", "스쿼시 단체 수업권이 없습니다.", [{ text: "확인" }]);
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
        </SafeAreaView>
    );
};
