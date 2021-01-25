import React from "react";
import {
    Dimensions,
    SafeAreaView,
    Text,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { MyStyles } from "../../css/MyStyles";

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
                    <Text>Information</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => navigation.navigate("Class")}
                >
                    <Text>Reservation</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() => {}}
                >
                    <Text>Blank</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
