import React, { useContext, useEffect, useState } from "react";
import {
    View,
    TouchableOpacity,
    StatusBar,
    Keyboard,
    Image,
    Platform,
    Dimensions,
} from "react-native";
import { AuthContext } from "../Auth";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TextInput, Button } from "react-native-paper";
import { theme } from "../../css/MyStyles";
import Constants from "expo-constants";

export default SignIn = ({ navigation }) => {
    const { width } = Dimensions.get("screen");
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const { signIn } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    const login = () => {
        setLoading(true);
        signIn({
            email: id + "@test.com",
            password,
        }).catch(() => {
            setLoading(false);
        });
    };

    const checkId = (str) => {
        var reg = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"\s]/gi;
        //특수문자 검증
        if (reg.test(str)) {
            //특수문자 제거후 리턴
            return str.replace(reg, "");
        } else {
            //특수문자가 없으므로 본래 문자 리턴
            return str;
        }
    };

    useEffect(() => {
        setId(checkId(id));
    }, [id]);

    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" />
            <KeyboardAwareScrollView
                contentContainerStyle={{
                    paddingHorizontal: -30,
                }}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                extraScrollHeight={Platform.select({
                    ios: 10,
                    android: width >= 800 ? hp("18%") : hp("10%"),
                })}
                enableOnAndroid={true}
                enableAutomaticScroll
            >
                <TouchableOpacity
                    style={{ flex: 1, alignSelf: "stretch", height: hp("100%") }}
                    onPress={Keyboard.dismiss}
                    accessible={false}
                    activeOpacity={1}
                >
                    <View style={{ flex: 1, marginBottom: 34 }}>
                        <View
                            style={{
                                backgroundColor: theme.colors.primary,
                                marginBottom: 20,
                                paddingTop: Platform.select({
                                    ios: Constants.statusBarHeight,
                                    android: 0,
                                }),
                            }}
                        >
                            <Image
                                style={[
                                    {
                                        width: wp("100%"),
                                        alignSelf: "center",
                                        marginBottom: 20,
                                    },
                                    width >= 800
                                        ? { height: hp("60%") }
                                        : width >= 550
                                        ? { height: hp("47%") }
                                        : { height: hp("40%") },
                                ]}
                                source={require("../../assets/login.png")}
                            />
                        </View>
                        <View style={{ paddingHorizontal: 20 }}>
                            <View style={{ marginBottom: 10 }}>
                                <TextInput label="아이디" value={id} onChangeText={setId} />
                            </View>
                            <View style={{ marginBottom: 10 }}>
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
                                    disabled={!id || !password}
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
                    </View>
                </TouchableOpacity>
            </KeyboardAwareScrollView>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
