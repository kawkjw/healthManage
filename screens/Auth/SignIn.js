import React, { useContext, useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Keyboard,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AuthContext } from "../Auth";
import { AuthStyles } from "../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default SignIn = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useContext(AuthContext);
  return (
    <SafeAreaView style={AuthStyles.container}>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
      />
      <KeyboardAwareScrollView
        style={{ alignSelf: "stretch" }}
        contentContainerStyle={{ height: hp("90%") }}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={AuthStyles.touchScreen}
          onPress={Keyboard.dismiss}
          accessible={false}
          activeOpacity={1}
        >
          <View style={AuthStyles.textView}>
            <Text style={AuthStyles.text}>Enter Email</Text>
            <TextInput
              style={AuthStyles.textInput}
              placeholder="examples@example.com"
              autoCompleteType="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={AuthStyles.textView}>
            <Text style={AuthStyles.text}>Enter Password</Text>
            <TextInput
              style={AuthStyles.textInput}
              placeholder="Input password"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
          </View>
          <View style={[AuthStyles.textView, { flexDirection: "row" }]}>
            <TouchableOpacity
              style={[AuthStyles.authButton, { marginRight: 5 }]}
              disabled={!email || !password}
              onPress={() => signIn({ email, password })}
            >
              <Text
                style={[
                  AuthStyles.authText,
                  !email || !password ? { color: "#a9a9a9" } : undefined,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[AuthStyles.authButton, { marginLeft: 5 }]}
              onPress={() => navigation.navigate("resetpw")}
            >
              <Text style={AuthStyles.authText}>Reset Pw</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 35 }}>
            <TouchableOpacity
              style={AuthStyles.authButton}
              onPress={() => navigation.navigate("signup")}
            >
              <Text style={AuthStyles.authText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};
