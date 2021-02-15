import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { AuthStyles } from "../../../css/MyStyles";

export default FindUser = ({ navigation, route }) => {
    const [inputName, setInputName] = useState("");
    const [inputPhoneNumber, setInputPhoneNumber] = useState("");

    useEffect(() => {
        if (route.params !== undefined) {
            const { name, phoneNumber } = route.params;
            setInputName(name);
            setInputPhoneNumber(phoneNumber);
        }
    }, []);

    useEffect(() => {
        if (route.params === undefined) {
            setInputPhoneNumber(
                inputPhoneNumber
                    .replace(/[^0-9]/g, "")
                    .replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3")
                    .replace("--", "-")
            );
        }
    }, [inputPhoneNumber]);

    return (
        <SafeAreaView style={AuthStyles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, alignSelf: "stretch" }}
            >
                <TouchableOpacity
                    key="keyboard"
                    style={[
                        AuthStyles.touchScreen,
                        { justifyContent: "flex-start", paddingTop: 20 },
                    ]}
                    onPress={Keyboard.dismiss}
                    accessible={false}
                    activeOpacity={1}
                >
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>고객 이름</Text>
                        <TextInput
                            style={AuthStyles.textInput}
                            placeholder="이름"
                            autoCompleteType="name"
                            keyboardType="default"
                            textContentType="name"
                            value={inputName}
                            onChangeText={setInputName}
                        />
                    </View>
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>휴대폰 번호</Text>
                        <TextInput
                            style={AuthStyles.textInput}
                            placeholder="010-0000-0000"
                            autoCompleteType="tel"
                            keyboardType="phone-pad"
                            textContentType="telephoneNumber"
                            maxLength={13}
                            value={inputPhoneNumber}
                            onChangeText={setInputPhoneNumber}
                        />
                    </View>
                    <View style={{ height: 35 }}>
                        <TouchableOpacity
                            style={AuthStyles.authButton}
                            disabled={!inputName && !inputPhoneNumber}
                            onPress={() =>
                                navigation.replace("SelectUser", {
                                    name: inputName,
                                    phoneNumber: inputPhoneNumber,
                                })
                            }
                        >
                            <Text style={AuthStyles.authText}>검색</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
