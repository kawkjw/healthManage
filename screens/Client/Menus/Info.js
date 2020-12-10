import React from "react";
import {
  Dimensions,
  SafeAreaView,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
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
          <Text>QR Code Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 20 },
          ]}
          onPress={() => navigation.navigate("Test")}
        >
          <Text>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 20 },
          ]}
          onPress={() => navigation.navigate("Test")}
        >
          <Text>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 20 },
          ]}
          onPress={() => navigation.navigate("Test")}
        >
          <Text>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 20 },
          ]}
          onPress={() => navigation.navigate("Test")}
        >
          <Text>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 20 },
          ]}
          onPress={() => navigation.navigate("Test")}
        >
          <Text>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 20 },
          ]}
          onPress={() => navigation.navigate("Test")}
        >
          <Text>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 20 },
          ]}
          onPress={() => navigation.navigate("Test")}
        >
          <Text>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 20 },
          ]}
          onPress={() => navigation.navigate("Test")}
        >
          <Text>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 40 }, //마지막은 40으로
          ]}
          onPress={() => navigation.navigate("Test")}
        >
          <Text>Test</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
