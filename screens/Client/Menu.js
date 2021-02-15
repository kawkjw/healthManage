import React from "react";
import { Dimensions, SafeAreaView, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { MyStyles } from "../../css/MyStyles";
import { RFPercentage } from "react-native-responsive-fontsize";

export default Menu = ({ navigation }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;

    return (
        <SafeAreaView style={MyStyles.container}>
            <ScrollView
                style={{
                    flex: 1,
                    paddingTop: 20,
                    alignSelf: "stretch",
                }}
                contentContainerStyle={{ alignItems: "center" }}
            >
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Info")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>정보</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Class")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>예약</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 40 },
                    ]}
                    onPress={() =>
                        Alert.alert(
                            "주의사항",
                            "3개월권은 연장 불가능이며, 6개월권은 1번, 12개월권은 2번까지 연장 가능합니다.",
                            [{ text: "확인", onPress: () => navigation.navigate("ExtendDate") }]
                        )
                    }
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>회원권 연장 신청</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
