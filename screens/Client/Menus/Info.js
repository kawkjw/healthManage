import React from "react";
import { TouchableOpacity, ScrollView, View, Alert } from "react-native";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Surface, Text } from "react-native-paper";
import ToHome from "../../../components/ToHome";

export default Info = ({ navigation }) => {
    return (
        <View style={MyStyles.container}>
            <ToHome navigation={navigation} />
            <ScrollView
                style={{
                    flex: 1,
                    paddingTop: 20,
                    alignSelf: "stretch",
                }}
                contentContainerStyle={{ alignItems: "center" }}
            >
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => Alert.alert("추후에 공개 예정입니다.")}
                        //onPress={() => navigation.navigate("QRScan")}
                    >
                        <Text style={TextSize.largeSize}>QR 코드 스캔</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("SelectTrainer")}
                    >
                        <Text style={TextSize.largeSize}>OT 예약</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => navigation.navigate("Test")}
                        disabled={true}
                    >
                        <Text style={[TextSize.largeSize, { marginBottom: 3 }]}>
                            기구 이용 정보 서비스는
                        </Text>
                        <Text style={TextSize.largeSize}>추후에 공개 예정입니다.</Text>
                    </TouchableOpacity>
                </Surface>
                <View style={{ height: hp("2%") }} />
            </ScrollView>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
