import React from "react";
import { Dimensions, SafeAreaView, Text, TouchableOpacity, ScrollView } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MyStyles } from "../../../css/MyStyles";

export default Info = ({ navigation }) => {
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
                    onPress={() => navigation.navigate("QRScan")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>QR 코드 스캔</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("SelectTrainer")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>OT 예약</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>Test 1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>Test 2</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>Test 3</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>Test 4</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>Test 5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>Test 6</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>Test 7</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>Test 8</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 40 }, //마지막은 40으로
                    ]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={{ fontSize: RFPercentage(2.3) }}>Test 9</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
