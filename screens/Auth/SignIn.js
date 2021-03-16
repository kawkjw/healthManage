import React, { useContext, useEffect, useState } from "react";
import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Keyboard,
    Platform,
    ScrollView,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
} from "react-native";
import { AuthContext } from "../Auth";
import { AuthStyles, MyStyles, TextSize } from "../../css/MyStyles";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default SignIn = ({ navigation }) => {
    const [id, setId] = useState("");
    const [mailAddress, setMailAddress] = useState("");
    const [password, setPassword] = useState("");
    const { signIn } = useContext(AuthContext);
    const [mailShow, setMailShow] = useState(false);
    const [mailTop, setMailTop] = useState(0);
    const [mailWidth, setMailWidth] = useState(0);
    const mailList = ["gmail.com", "naver.com", "daum.net", "me.com", "nate.com"];
    const [mailBoxDisplay, setMailBoxDisplay] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMailBoxDisplay(true);
        let chk = false;
        mailList.forEach((mail) => {
            if (mailAddress === mail.slice(0, mailAddress.length)) {
                chk = true;
            }
        });
        if (!chk) {
            setMailBoxDisplay(false);
        }
    }, [mailAddress]);

    const login = () => {
        setLoading(true);
        signIn({
            email: id + "@" + mailAddress,
            password,
        }).catch(() => {
            setLoading(false);
        });
    };

    return (
        <SafeAreaView style={AuthStyles.container}>
            <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />
            <KeyboardAwareScrollView
                contentContainerStyle={{
                    marginTop: 30,
                    paddingHorizontal: -30,
                }}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                extraHeight={Platform.select({ android: 120, ios: 130 })}
                extraScrollHeight={hp("17%")}
                enableOnAndroid={true}
                enableAutomaticScroll
            >
                {mailShow && (
                    <View
                        style={[
                            {
                                position: "absolute",
                                width: mailWidth,
                                zIndex: 1,
                                top: mailTop,
                                right: 30,
                            },
                            mailBoxDisplay
                                ? { display: "flex", backgroundColor: "white" }
                                : { display: "none" },
                        ]}
                    >
                        <ScrollView
                            style={{ height: hp("13%"), padding: 5 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {mailList.map((mail, index) => (
                                <View key={index}>
                                    {mailAddress === mail.slice(0, mailAddress.length) ? (
                                        <View style={{ borderBottomWidth: 1 }}>
                                            <TouchableOpacity
                                                style={{
                                                    paddingTop: 1,
                                                    marginBottom: 5,
                                                    paddingLeft: 5,
                                                }}
                                                onPress={() => {
                                                    setMailAddress(mail);
                                                    setMailShow(false);
                                                    Keyboard.dismiss();
                                                }}
                                            >
                                                <Text style={TextSize.largeSize}>{mail}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : undefined}
                                </View>
                            ))}
                            <View style={{ height: hp("1%") }} />
                        </ScrollView>
                    </View>
                )}
                <TouchableOpacity
                    style={AuthStyles.touchScreen}
                    //style={{ justifyContent: "center" }}
                    onPress={() => {
                        Keyboard.dismiss();
                        setMailShow(false);
                    }}
                    accessible={false}
                    activeOpacity={1}
                >
                    <Image
                        style={[
                            MyStyles.image,
                            {
                                width: wp("80%"),
                                alignSelf: "center",
                                marginBottom: 30,
                            },
                        ]}
                        source={{
                            uri: "https://reactnative.dev/img/tiny_logo.png",
                        }}
                    />
                    <View
                        style={AuthStyles.textView}
                        onLayout={(e) => {
                            setMailTop(e.nativeEvent.layout.height + e.nativeEvent.layout.y);
                        }}
                    >
                        <Text style={AuthStyles.text}>이메일</Text>
                        <View style={{ flexDirection: "row" }}>
                            <TextInput
                                style={[AuthStyles.textInput, { flex: 3 }]}
                                placeholder="아이디"
                                keyboardType="default"
                                value={id}
                                onChangeText={setId}
                                onFocus={() => {
                                    setMailShow(false);
                                }}
                            />
                            <View
                                style={{
                                    flex: 1,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={TextSize.largerSize}>@</Text>
                            </View>
                            <View
                                style={{
                                    flex: 4,
                                    flexDirection: "row",
                                    borderWidth: 1,
                                }}
                                onLayout={(e) => {
                                    setMailWidth(e.nativeEvent.layout.width);
                                }}
                            >
                                <TextInput
                                    style={[AuthStyles.textInput, { flex: 1, borderWidth: 0 }]}
                                    keyboardType="default"
                                    placeholder="이메일 주소"
                                    value={mailAddress}
                                    onChangeText={setMailAddress}
                                    onFocus={() => {
                                        setMailShow(true);
                                    }}
                                />
                                <View style={{ justifyContent: "center" }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            setMailShow(!mailShow);
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={mailShow ? "chevron-up" : "chevron-down"}
                                            size={30}
                                            color="black"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>비밀번호</Text>
                        <TextInput
                            style={AuthStyles.textInput}
                            placeholder="비밀번호"
                            secureTextEntry={true}
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() => {
                                setMailShow(false);
                            }}
                        />
                    </View>
                    <View style={[AuthStyles.textView, { flexDirection: "row" }]}>
                        <TouchableOpacity
                            style={[AuthStyles.authButton, { marginRight: 5 }]}
                            disabled={!id || !mailAddress || !password}
                            onPress={() => login()}
                        >
                            {loading ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <Text
                                    style={[
                                        AuthStyles.authText,
                                        !id || !mailAddress || !password
                                            ? { color: "#a9a9a9" }
                                            : undefined,
                                    ]}
                                >
                                    로그인
                                </Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[AuthStyles.authButton, { marginLeft: 5 }]}
                            onPress={() => navigation.navigate("resetpw")}
                        >
                            <Text style={AuthStyles.authText}>비밀번호 초기화</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 35 }}>
                        <TouchableOpacity
                            style={AuthStyles.authButton}
                            onPress={() => navigation.navigate("signup")}
                        >
                            <Text style={AuthStyles.authText}>회원가입</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 30 }} />
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};
