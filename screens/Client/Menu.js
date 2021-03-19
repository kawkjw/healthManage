import React from "react";
import { Text, TouchableOpacity, ScrollView, Alert, View } from "react-native";
import { Surface } from "react-native-paper";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { MyStyles, TextSize } from "../../css/MyStyles";

export default Menu = ({ navigation }) => {
    return (
        <View style={MyStyles.container}>
            <ScrollView
                style={{
                    paddingTop: 20,
                    alignSelf: "stretch",
                }}
                contentContainerStyle={{ alignItems: "center" }}
            >
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("Info")}
                    >
                        <Text style={TextSize.largeSize}>OT 예약 및 기구 사용 정보</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("Class")}
                    >
                        <Text style={TextSize.largeSize}>예약</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() =>
                            Alert.alert(
                                "주의사항",
                                "3개월권은 연장 불가능이며, 6개월권은 1번, 12개월권은 2번까지 연장 가능합니다.",
                                [
                                    {
                                        text: "확인",
                                        onPress: () => navigation.navigate("ExtendDate"),
                                    },
                                ],
                                { cancelable: false }
                            )
                        }
                    >
                        <Text style={TextSize.largeSize}>회원권 연장 신청</Text>
                    </TouchableOpacity>
                </Surface>
            </ScrollView>
            <View style={{ backgroundColor: "#3366cc", height: hp("6%"), width: "100%" }} />
        </View>
    );
};
