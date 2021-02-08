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
            <StatusBar barStyle="dark-content" />
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
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>Enter Email</Text>
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
                    </View>
                    <View style={{ height: 35 }}>
                        <TouchableOpacity style={AuthStyles.authButton} onPress={sendResetMail}>
                            <Text style={AuthStyles.authText}>Send Reset Password Mail</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
