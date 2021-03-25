import React from "react";
import { View, ScrollView, Text, TouchableOpacity } from "react-native";
import { Surface } from "react-native-paper";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default SelectMembership = ({ navigation, route }) => {
    const goClientsbyMembership = (name) => {
        navigation.replace("ClientsbyMembership", { membershipName: name });
    };

    return (
        <View style={MyStyles.container}>
            <ScrollView
                style={{ flex: 1, alignSelf: "stretch", paddingVertical: 10 }}
                contentContainerStyle={{ alignItems: "center" }}
                showsVerticalScrollIndicator={false}
            >
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClientsbyMembership("health")}
                    >
                        <Text style={TextSize.largeSize}>헬스</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClientsbyMembership("pt")}
                    >
                        <Text style={TextSize.largeSize}>PT</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClientsbyMembership("spinning")}
                    >
                        <Text style={TextSize.largeSize}>스피닝</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClientsbyMembership("squash")}
                    >
                        <Text style={TextSize.largeSize}>스쿼시</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClientsbyMembership("pilates")}
                    >
                        <Text style={TextSize.largeSize}>필라테스</Text>
                    </TouchableOpacity>
                </Surface>
                <Surface style={MyStyles.surface}>
                    <TouchableOpacity
                        style={MyStyles.menu}
                        onPress={() => goClientsbyMembership("gx")}
                    >
                        <Text style={TextSize.largeSize}>GX(요가, 줌바)</Text>
                    </TouchableOpacity>
                </Surface>
            </ScrollView>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
