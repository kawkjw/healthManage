import React, { useEffect, useState } from "react";
import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Keyboard,
    KeyboardAvoidingView,
} from "react-native";
import myBase from "../../config/MyBase";
import { AuthStyles } from "../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default ResetPw = () => {
    const [email, setEmail] = useState("");
    const [checkEmail, setCheckEmail] = useState(false);

    const chkEmail = (str) => {
        const reg_email = /^([0-9a-zA-Z_\.-]+)@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/;
        if (!reg_email.test(str)) {
            return false;
        } else {
            return true;
        }
    };

    useEffect(() => {
        setCheckEmail(chkEmail(email));
    }, [email]);

    const sendResetMail = async () => {
        await myBase
            .auth()
            .sendPasswordResetEmail(email)
            .then(() => {
                alert("Send Password Reset Mail");
            })
            .catch((error) => {
                if (error.code === "auth/invalid-email") {
                    alert("Invalid Email");
                } else if (error.code === "auth/user-not-found") {
                    alert("User Not Found");
                } else {
                    alert(error.message);
                }
            });
    };

    return (
        <SafeAreaView style={AuthStyles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, alignSelf: "stretch" }}
            >
                <TouchableOpacity
                    style={AuthStyles.touchScreen}
                    onPress={Keyboard.dismiss}
                    accessible={false}
                    activeOpacity={1}
                >
                    <KeyboardAvoidingView
                        style={{
                            paddingHorizontal: 20,
                            height: hp("90%"),
                            alignSelf: "stretch",
                            justifyContent: "center",
                        }}
                        behavior="position"
                        keyboardVerticalOffset={-100}
                    >
                        <Text style={AuthStyles.text}>이메일</Text>
                        <TextInput
                            style={[
                                AuthStyles.textInput,
                                email
                                    ? checkEmail
                                        ? { backgroundColor: "green" }
                                        : { backgroundColor: "red" }
                                    : undefined,
                            ]}
                            placeholder="examples@example.com"
                            autoCompleteType="email"
                            keyboardType="email-address"
                            textContentType="emailAddress"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <View style={{ height: 35, marginTop: 10 }}>
                            <TouchableOpacity style={AuthStyles.authButton} onPress={sendResetMail}>
                                <Text style={AuthStyles.authText}>비밀번호 초기화</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
