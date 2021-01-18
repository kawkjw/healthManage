import React from "react";
import {
    Dimensions,
    SafeAreaView,
    Text,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { MyStyles } from "../../../css/MyStyles";

export default Class = ({ navigation }) => {
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
                    onPress={() => navigation.navigate("PT")}
                >
                    <Text>PT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() =>
                        navigation.navigate("GX", { classname: "pilates" })
                    }
                >
                    <Text>필라테스</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() =>
                        navigation.navigate("GX", { classname: "spinning" })
                    }
                >
                    <Text>스피닝</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() =>
                        navigation.navigate("GX", { classname: "squash" })
                    }
                >
                    <Text>스쿼시</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 20 },
                    ]}
                    onPress={() =>
                        navigation.navigate("GX", { classname: "yoga" })
                    }
                >
                    <Text>요가</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        MyStyles.phoneButton,
                        MyStyles.buttonShadow,
                        { width: widthButton, marginBottom: 40 },
                    ]}
                    onPress={() =>
                        navigation.navigate("GX", { classname: "zoomba" })
                    }
                >
                    <Text>줌바</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
