import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { MyStyles, TextSize } from "../../../css/MyStyles";

export default SelectSquashKind = ({ navigation, route }) => {
    return (
        <SafeAreaView style={MyStyles.container}>
            <View style={{ marginTop: 10 }} />
            <TouchableOpacity
                style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                onPress={() =>
                    navigation.navigate("PT", { ptName: "squash", limit: route.params.limit })
                }
            >
                <Text style={TextSize.largeSize}>개인 수업</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                onPress={() =>
                    navigation.navigate("GX", {
                        className: ["squash"],
                    })
                }
            >
                <Text style={TextSize.largeSize}>그룹 수업</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};
