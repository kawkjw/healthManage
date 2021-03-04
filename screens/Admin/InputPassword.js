import React, { useContext, useEffect, useState } from "react";
import {
    Alert,
    Keyboard,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as Crypto from "expo-crypto";
import { ADMIN_PW } from "@env";
import { AuthStyles, MyStyles } from "../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { RFPercentage } from "react-native-responsive-fontsize";
import { AuthContext } from "../Auth";

export default InputPassword = ({ navigation, route }) => {
    const [password, setPassword] = useState("");
    const [num, setNum] = useState(0);
    const { signOut } = useContext(AuthContext);

    const checkPassword = async () => {
        const digest = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password
        );
        if (ADMIN_PW === digest) {
            navigation.replace("Sales");
        } else {
            setNum(num + 1);
            setPassword("");
            Alert.alert(
                "경고",
                `비밀번호 ${num + 1}회 틀렸습니다.\n5회 틀릴 경우 로그아웃 됩니다.`,
                [{ text: "확인" }]
            );
        }
    };

    useEffect(() => {
        if (num === 5) {
            signOut();
        }
    }, [num]);

    return (
        <SafeAreaView style={AuthStyles.container}>
            <TouchableOpacity
                style={{ alignSelf: "stretch" }}
                onPress={Keyboard.dismiss}
                activeOpacity={1}
                accessible={false}
            >
                <View
                    style={{
                        paddingHorizontal: 40,
                        height: hp("90%"),
                        alignSelf: "stretch",
                        justifyContent: "center",
                    }}
                >
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="비밀번호"
                        secureTextEntry={true}
                        style={AuthStyles.textInput}
                    />
                    <TouchableOpacity
                        style={[
                            MyStyles.buttonShadow,
                            {
                                marginTop: 10,
                                height: hp("5%"),
                                borderRadius: 10,
                                alignItems: "center",
                                justifyContent: "center",
                            },
                        ]}
                        disabled={!password}
                        onPress={checkPassword}
                    >
                        <Text style={{ fontSize: RFPercentage(2.3) }}>확인</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </SafeAreaView>
    );
};
