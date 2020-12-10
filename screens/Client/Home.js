import React from "react";
import {
  Image,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Linking,
  StatusBar,
  Platform,
} from "react-native";
import { MyStyles } from "../../css/MyStyles";

export default Home = ({ navigation, route }) => {
  const { width } = Dimensions.get("screen");
  const widthButton = width - 40;
  const widthImage = widthButton - 60;

  return (
    <SafeAreaView style={MyStyles.container}>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
      />
      <View style={{ flex: 1, justifyContent: "center" }}>
        <TouchableOpacity
          style={[
            MyStyles.profileButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 20 },
          ]}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text>Profile</Text>
          <Image
            style={[MyStyles.image, { width: widthImage }]}
            source={{
              uri: "https://reactnative.dev/img/tiny_logo.png",
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton, marginBottom: 20 },
          ]}
          onPress={() => navigation.navigate("Menu")}
        >
          <Text>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            MyStyles.phoneButton,
            MyStyles.buttonShadow,
            { width: widthButton },
          ]}
          onPress={() => {
            Linking.openURL("tel:12345678");
          }}
        >
          <Text>전화 연결</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
