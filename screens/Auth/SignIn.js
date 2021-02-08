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
} from "react-native";
import { AuthContext } from "../Auth";
import { AuthStyles, MyStyles } from "../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { RFPercentage } from "react-native-responsive-fontsize";
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
    const mailList = [
        "gmail.com",
        "naver.com",
        "daum.net",
        "me.com",
        "nate.com",
    ];
    const [mailBoxDisplay, setMailBoxDisplay] = useState(true);

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

    return (
        <SafeAreaView style={AuthStyles.container}>
            <StatusBar
                barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
            />
            <KeyboardAwareScrollView
                style={{ alignSelf: "stretch" }}
                contentContainerStyle={{ height: hp("90%") }}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                extraScrollHeight={110}
            >
                {mailShow && (
                    <View
                        style={[
                            {
                                position: "absolute",
                                backgroundColor: "white",
                                width: mailWidth,
                                zIndex: 1,
                                top: mailTop,
                                right: 30,
                            },
                            mailBoxDisplay
                                ? { display: "flex" }
                                : { display: "none" },
                        ]}
                    >
                        <ScrollView
                            style={{ height: hp("13%"), padding: 5 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {mailList.map((mail, index) => (
                                <View key={index}>
                                    {mailAddress ===
                                    mail.slice(0, mailAddress.length) ? (
                                        <View
                                            style={{ borderBottomWidth: "0.5" }}
                                        >
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
                                                <Text
                                                    style={{
                                                        fontSize: RFPercentage(
                                                            2.5
                                                        ),
                                                    }}
                                                >
                                                    {mail}
                                                </Text>
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
                                width: "100%",
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
                            setMailTop(
                                e.nativeEvent.layout.height +
                                    e.nativeEvent.layout.y
                            );
                        }}
                    >
                        <Text style={AuthStyles.text}>Enter Email</Text>
                        <View style={{ flexDirection: "row" }}>
                            <TextInput
                                style={[AuthStyles.textInput, { flex: 3 }]}
                                placeholder="ID"
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
                                <Text style={{ fontSize: RFPercentage(3) }}>
                                    @
                                </Text>
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
                                    style={[
                                        AuthStyles.textInput,
                                        { flex: 1, borderWidth: 0 },
                                    ]}
                                    keyboardType="default"
                                    placeholder="Mail Address"
                                    value={mailAddress}
                                    onChangeText={setMailAddress}
                                    onFocus={() => {
                                        setMailShow(true);
                                    }}
                                />
                                <TouchableOpacity
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setMailShow(!mailShow);
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name="chevron-down"
                                        size={30}
                                        color="black"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>Enter Password</Text>
                        <TextInput
                            style={AuthStyles.textInput}
                            placeholder="Input password"
                            secureTextEntry={true}
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() => {
                                setMailShow(false);
                            }}
                        />
                    </View>
                    <View
                        style={[AuthStyles.textView, { flexDirection: "row" }]}
                    >
                        <TouchableOpacity
                            style={[AuthStyles.authButton, { marginRight: 5 }]}
                            disabled={!id || !mailAddress || !password}
                            onPress={() =>
                                signIn({
                                    email: id + "@" + mailAddress,
                                    password,
                                })
                            }
                        >
                            <Text
                                style={[
                                    AuthStyles.authText,
                                    !id || !mailAddress || !password
                                        ? { color: "#a9a9a9" }
                                        : undefined,
                                ]}
                            >
                                Sign In
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[AuthStyles.authButton, { marginLeft: 5 }]}
                            onPress={() => navigation.navigate("resetpw")}
                        >
                            <Text style={AuthStyles.authText}>Reset Pw</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 35 }}>
                        <TouchableOpacity
                            style={AuthStyles.authButton}
                            onPress={() => navigation.navigate("signup")}
                        >
                            <Text style={AuthStyles.authText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};
