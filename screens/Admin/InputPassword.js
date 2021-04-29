import React, { useContext, useEffect, useState } from "react";
import { Alert, Keyboard, TouchableOpacity, View, KeyboardAvoidingView } from "react-native";
import * as Crypto from "expo-crypto";
import { TextSize, theme } from "../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { AuthContext } from "../Auth";
import { WrongNumContext, AdminContext } from "./ANavigator";
import { Button, TextInput } from "react-native-paper";

export default InputPassword = ({ navigation, route }) => {
    if (!route.params) {
        navigation.goBack();
    }

    const [password, setPassword] = useState("");
    const { signOut } = useContext(AuthContext);
    const { num, setNum } = useContext(WrongNumContext);
    const { key } = useContext(AdminContext);

    const checkPassword = async () => {
        const digest = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password
        );
        if (key === digest) {
            setNum(0);
            navigation.replace(route.params.to);
        } else {
            setNum(num + 1);
            setPassword("");
            Alert.alert(
                "경고",
                `비밀번호 ${num + 1}회 틀렸습니다.\n5회 틀릴 경우 로그아웃 됩니다.`,
                [{ text: "확인" }],
                { cancelable: false }
            );
        }
    };

    useEffect(() => {
        if (num === 5) {
            signOut();
        }
    }, [num]);

    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <TouchableOpacity
                style={{ alignSelf: "stretch" }}
                onPress={Keyboard.dismiss}
                activeOpacity={1}
                accessible={false}
            >
                <KeyboardAvoidingView
                    style={{
                        paddingHorizontal: 40,
                        height: hp("84%"),
                        alignSelf: "stretch",
                        justifyContent: "center",
                    }}
                    behavior="position"
                    keyboardVerticalOffset={-100}
                >
                    <TextInput
                        label="비밀번호"
                        mode="flat"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="비밀번호"
                        secureTextEntry={true}
                        style={{ marginBottom: 10 }}
                    />
                    <Button
                        mode="contained"
                        disabled={!password}
                        onPress={checkPassword}
                        labelStyle={TextSize.largeSize}
                    >
                        확인
                    </Button>
                </KeyboardAvoidingView>
            </TouchableOpacity>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
