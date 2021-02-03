import React, { useContext, useEffect, useState } from "react";
import {
    Text,
    View,
    TextInput,
    Button,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Keyboard,
    Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AuthContext } from "../Auth";
import { AuthStyles } from "../../css/MyStyles";
import CheckBox from "../../config/CheckBox";
import { db } from "../../config/MyBase";
import { RFPercentage } from "react-native-responsive-fontsize";

export default SignUp = ({ navigation }) => {
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [chkPassword, setChkPassword] = useState("");
    const [selected, setSelected] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [checkEmail, setCheckEmail] = useState(false);
    const [chkUsedEmail, setChkUsedEmail] = useState(false);
    const [checkPw, setCheckPw] = useState(false);
    const [correctPw, setCorrectPw] = useState(false);

    const { signUp } = useContext(AuthContext);

    useEffect(() => {
        if (password && password === chkPassword) {
            setCheckPw(true);
        } else {
            setCheckPw(false);
        }
    }, [chkPassword]);

    const chkPwd = (str) => {
        const pw = str;
        const num = pw.search(/[0-9]/g);
        const eng = pw.search(/[a-z]/gi);
        const spe = pw.search(/[`~!@@#$%^&*|₩₩₩'₩";:₩/?]/gi);

        if (pw.length < 8 || pw.length > 15) {
            //alert("8자리 ~ 15자리 이내로 입력해주세요.");
            return false;
        }
        if (pw.search(/₩s/) != -1) {
            //alert("비밀번호는 공백없이 입력해주세요.");
            return false;
        }
        if (
            (num < 0 && eng < 0) ||
            (eng < 0 && spe < 0) ||
            (spe < 0 && num < 0)
        ) {
            //alert("영문, 숫자, 특수문자 중 2가지 이상을 혼합하여 입력해주세요.");
            return false;
        }

        return true;
    };

    useEffect(() => {
        setCorrectPw(chkPwd(password));
    }, [password]);

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

    useEffect(() => {
        setPhoneNumber(
            phoneNumber
                .replace(/[^0-9]/g, "")
                .replace(
                    /(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,
                    "$1-$2-$3"
                )
                .replace("--", "-")
        );
    }, [phoneNumber]);

    const checkUsedEmail = async () => {
        if (email && checkEmail) {
            await db
                .collection("emails")
                .where("email", "==", email)
                .get()
                .then((snapshot) => {
                    let data = {};
                    snapshot.forEach((doc) => {
                        data = doc.data();
                    });
                    if (Object.keys(data).length === 0) {
                        setChkUsedEmail(true);
                        Alert.alert("Success", "Use your email", [
                            { text: "OK" },
                        ]);
                    } else {
                        Alert.alert("Error", "Already used email!", [
                            {
                                text: "OK",
                                onPress: () => {
                                    setEmail("");
                                    setChkUsedEmail(false);
                                },
                            },
                        ]);
                    }
                })
                .catch((error) => console.log(error));
        } else if (!email) {
            Alert.alert("Error", "Input email", [{ text: "OK" }]);
        } else {
            Alert.alert("Error", "Wrong type of email", [{ text: "OK" }]);
        }
    };

    return (
        <SafeAreaView style={AuthStyles.container}>
            <KeyboardAwareScrollView
                style={{ alignSelf: "stretch", marginTop: 20 }}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    style={AuthStyles.touchScreen}
                    onPress={Keyboard.dismiss}
                    accessible={false}
                    activeOpacity={1}
                >
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>Enter Name</Text>
                        <TextInput
                            style={AuthStyles.textInput}
                            placeholder="Name"
                            autoCompleteType="name"
                            keyboardType="default"
                            textContentType="name"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>Enter Phone Number</Text>
                        <TextInput
                            style={AuthStyles.textInput}
                            placeholder="010-0000-0000"
                            autoCompleteType="tel"
                            keyboardType="phone-pad"
                            textContentType="telephoneNumber"
                            maxLength={13}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />
                    </View>
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
                        <View style={{ height: 35, marginTop: 10 }}>
                            <TouchableOpacity
                                style={AuthStyles.authButton}
                                onPress={checkUsedEmail}
                            >
                                <Text style={AuthStyles.authText}>
                                    Email Used?
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>Enter Password</Text>
                        <Text style={{ color: "#8c8c8c", marginBottom: 5 }}>
                            길이는 8자 이상 15자 이하이며{"\n"}영문, 숫자,
                            특수문자 중 2가지 이상을 혼합하여 입력해주세요
                        </Text>
                        <TextInput
                            style={[
                                AuthStyles.textInput,
                                password
                                    ? correctPw
                                        ? { backgroundColor: "green" }
                                        : { backgroundColor: "red" }
                                    : undefined,
                            ]}
                            placeholder="Input password"
                            secureTextEntry={true}
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>
                            Enter Check Password
                        </Text>
                        <TextInput
                            style={[
                                AuthStyles.textInput,
                                password
                                    ? checkPw
                                        ? { backgroundColor: "green" }
                                        : { backgroundColor: "red" }
                                    : undefined,
                            ]}
                            placeholder="Input password again"
                            secureTextEntry={true}
                            value={chkPassword}
                            onChangeText={setChkPassword}
                        />
                    </View>
                    <View style={AuthStyles.textView}>
                        <CheckBox
                            selected={selected}
                            onPress={() => {
                                setSelected(!selected);
                            }}
                            text=" Are you admin?"
                            textStyle={{ fontSize: RFPercentage(2) }}
                            size={RFPercentage(2.5)}
                            style={{ marginBottom: 10 }}
                        />
                        {selected ? (
                            <>
                                <Text style={AuthStyles.text}>
                                    Input Admin Code
                                </Text>
                                <TextInput
                                    style={AuthStyles.textInput}
                                    placeholder="00000000"
                                    keyboardType="phone-pad"
                                    maxLength={8}
                                    value={adminCode}
                                    onChangeText={setAdminCode}
                                />
                            </>
                        ) : null}
                    </View>
                    <View style={{ height: 35 }}>
                        <TouchableOpacity
                            style={AuthStyles.authButton}
                            disabled={
                                !name ||
                                !phoneNumber ||
                                !email ||
                                !password ||
                                !chkPassword ||
                                !chkUsedEmail ||
                                password !== chkPassword ||
                                !correctPw
                            }
                            onPress={async () => {
                                await signUp({
                                    name,
                                    phoneNumber,
                                    email,
                                    password,
                                    adminCode,
                                }).then(() => {
                                    navigation.goBack();
                                });
                            }}
                        >
                            <Text style={AuthStyles.authText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};
