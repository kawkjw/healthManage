import React from "react";
import { SafeAreaView, Text, TouchableOpacity, ScrollView } from "react-native";
import { MyStyles, TextSize } from "../../../css/MyStyles";

export default Info = ({ navigation }) => {
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
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("QRScan")}
                >
                    <Text style={TextSize.largeSize}>QR 코드 스캔</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("SelectTrainer")}
                >
                    <Text style={TextSize.largeSize}>OT 예약</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={TextSize.largeSize}>Test 1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={TextSize.largeSize}>Test 2</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={TextSize.largeSize}>Test 3</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={TextSize.largeSize}>Test 4</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={TextSize.largeSize}>Test 5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={TextSize.largeSize}>Test 6</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={TextSize.largeSize}>Test 7</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[MyStyles.phoneButton, MyStyles.buttonShadow, { marginBottom: 20 }]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={TextSize.largeSize}>Test 8</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { marginBottom: 40 }, //마지막은 40으로
                    ]}
                    onPress={() => navigation.navigate("Test")}
                >
                    <Text style={TextSize.largeSize}>Test 9</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
