import React, { useContext, useState } from "react";
import {
    View,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Keyboard,
    Platform,
    Image,
} from "react-native";
import { AuthContext } from "../Auth";
import { AuthStyles } from "../../css/MyStyles";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TextInput, Button } from "react-native-paper";

export default SignIn = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { signIn } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    const login = () => {
        setLoading(true);
        signIn({
            email,
            password,
        }).catch(() => {
            setLoading(false);
        });
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" />
            <KeyboardAwareScrollView
                contentContainerStyle={{
                    marginTop: 30,
                    paddingHorizontal: -30,
                }}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                extraScrollHeight={hp("17%")}
                enableOnAndroid={true}
                enableAutomaticScroll
            >
                <TouchableOpacity
                    style={{ flex: 1, alignSelf: "stretch" }}
                    onPress={Keyboard.dismiss}
                    accessible={false}
                    activeOpacity={1}
                >
                    <Image
                        style={[
                            {
                                width: wp("80%"),
                                aspectRatio: 1,
                                alignSelf: "center",
                                marginBottom: 20,
                            },
                        ]}
                        source={{
                            uri: "https://reactnative.dev/img/tiny_logo.png",
                        }}
                    />
                    <View style={{ paddingHorizontal: 20 }}>
                        <View style={AuthStyles.textView}>
                            <TextInput label="아이디" value={email} onChangeText={setEmail} />
                        </View>
                        <View style={AuthStyles.textView}>
                            <TextInput
                                label="비밀번호"
                                secureTextEntry={true}
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                        <View style={{ flexDirection: "row", marginBottom: 10 }}>
                            <Button
                                style={{ flex: 1, marginRight: 5 }}
                                mode="contained"
                                loading={loading}
                                onPress={() => {
                                    login();
                                }}
                            >
                                로그인
                            </Button>
                            <Button
                                style={{ flex: 1, marginLeft: 5 }}
                                mode="contained"
                                onPress={() => navigation.navigate("resetpw")}
                            >
                                비밀번호 초기화
                            </Button>
                        </View>
                        <Button mode="contained" onPress={() => navigation.navigate("signup")}>
                            회원가입
                        </Button>
                    </View>
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};
