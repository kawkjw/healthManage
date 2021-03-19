import React, { useEffect, useState } from "react";
import {
    TouchableOpacity,
    SafeAreaView,
    Keyboard,
    KeyboardAvoidingView,
    Alert,
} from "react-native";
import myBase from "../../config/MyBase";
import { AuthStyles } from "../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Button, HelperText, TextInput } from "react-native-paper";

export default ResetPw = ({ navigation }) => {
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
                Alert.alert("성공", "비밀번호 초기화 메일이 전송되었습니다.", [{ text: "확인" }], {
                    cancelable: false,
                });
                navigation.goBack();
            })
            .catch((error) => {
                if (error.code === "auth/invalid-email") {
                    Alert.alert("경고", "이메일이 잘못 입력되었습니다.", [{ text: "확인" }], {
                        cancelable: false,
                    });
                } else if (error.code === "auth/user-not-found") {
                    Alert.alert("경고", "가입되지 않은 이메일입니다.", [{ text: "확인" }], {
                        cancelable: false,
                    });
                } else {
                    Alert.alert("Error", error.message, [{ text: "OK" }], { cancelable: false });
                }
            });
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
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
                    <TextInput
                        label="이메일"
                        placeholder="examples@example.com"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        error={!checkEmail && email}
                        dense={true}
                    />
                    <HelperText type="error" visible={email && !checkEmail}>
                        이메일 형식이 맞지 않습니다.
                    </HelperText>
                    <Button mode="contained" onPress={sendResetMail}>
                        비밀번호 초기화
                    </Button>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </SafeAreaView>
    );
};
