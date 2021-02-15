import React from "react";
import { Dimensions, SafeAreaView, ScrollView, Text, TouchableOpacity } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MyStyles } from "../../../css/MyStyles";

export default SelectMembership = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;

    const goClientsbyMembership = (name) => {
        navigation.replace("ClientsbyMembership", { membershipName: name });
    };

    return (
        <SafeAreaView style={MyStyles.container}>
            <ScrollView
                style={{ flex: 1, alignSelf: "stretch", paddingVertical: 10 }}
                contentContainerStyle={{ alignItems: "center" }}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClientsbyMembership("health")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>헬스</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClientsbyMembership("pt")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>PT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClientsbyMembership("spinning")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>스피닝</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClientsbyMembership("squash")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>스쿼시</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClientsbyMembership("pilates")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>필라테스</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => goClientsbyMembership("GX")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>GX(요가, 줌바)</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
