import React, { useEffect, useState } from "react";
import { TouchableOpacity, View, Keyboard } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { theme } from "../../../css/MyStyles";

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
        <View style={{ flex: 1, alignItems: "center" }}>
            <TouchableOpacity
                key="keyboard"
                style={{
                    alignSelf: "stretch",
                    paddingHorizontal: 30,
                    marginTop: 10,
                    flex: 1,
                }}
                onPress={Keyboard.dismiss}
                accessible={false}
                activeOpacity={1}
            >
                <View style={{ marginBottom: 5 }}>
                    <TextInput
                        label="고객 이름"
                        mode="outlined"
                        dense={true}
                        placeholder="이름"
                        autoCompleteType="name"
                        keyboardType="default"
                        textContentType="name"
                        value={inputName}
                        onChangeText={setInputName}
                    />
                </View>
                <View style={{ marginBottom: 5 }}>
                    <TextInput
                        label="휴대폰 번호"
                        mode="outlined"
                        dense={true}
                        placeholder="010-0000-0000"
                        autoCompleteType="tel"
                        keyboardType="phone-pad"
                        textContentType="telephoneNumber"
                        maxLength={13}
                        value={inputPhoneNumber}
                        onChangeText={setInputPhoneNumber}
                    />
                </View>
                <Button
                    mode="contained"
                    disabled={!inputName && !inputPhoneNumber}
                    onPress={() =>
                        navigation.replace("SelectUser", {
                            name: inputName,
                            phoneNumber: inputPhoneNumber,
                        })
                    }
                >
                    검색
                </Button>
            </TouchableOpacity>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
