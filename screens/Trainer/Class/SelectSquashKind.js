import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text, Surface } from "react-native-paper";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default SelectSquashKind = ({ navigation, route }) => {
    return (
        <View style={MyStyles.container}>
            <View style={{ flex: 1, marginTop: 10 }}>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() =>
                            navigation.replace("PT", {
                                ptName: "squash",
                                limit: route.params.limit,
                            })
                        }
                    >
                        <Text style={TextSize.largeSize}>개인 수업</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() =>
                            navigation.replace("GX", {
                                className: ["squash"],
                            })
                        }
                    >
                        <Text style={TextSize.largeSize}>그룹 수업</Text>
                    </TouchableOpacity>
                </Surface>
            </View>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
