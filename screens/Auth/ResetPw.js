import React, { useEffect, useRef, useState } from "react";
import {
    TouchableOpacity,
    SafeAreaView,
    Keyboard,
    KeyboardAvoidingView,
    Alert,
    View,
} from "react-native";
import myBase from "../../config/MyBase";
import firebase from "firebase";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Button, HelperText, TextInput, Text } from "react-native-paper";
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from "expo-firebase-recaptcha";
import Modal from "react-native-modal";
import { TextFamily, TextSize, theme } from "../../css/MyStyles";

export default ResetPw = ({ navigation }) => {
    const appVerifier = useRef(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [verificationId, setVerificationId] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [modalChangePw, setModalChangePw] = useState(false);
    const [password, setPassword] = useState("");
    const [chkPassword, setChkPassword] = useState("");
    const [checkPw, setCheckPw] = useState(false);
    const [correctPw, setCorrectPw] = useState(false);
    const [showPasswordText, setShowPasswordText] = useState(false);
    const [showCheckPasswordText, setShowCheckPasswordText] = useState(false);

    useEffect(() => {
        setPhoneNumber(
            phoneNumber
                .replace(/[^0-9]/g, "")
                .replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3")
                .replace("--", "-")
        );
    }, [phoneNumber]);

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
        if ((num < 0 && eng < 0) || (eng < 0 && spe < 0) || (spe < 0 && num < 0)) {
            //alert("영문, 숫자, 특수문자 중 2가지 이상을 혼합하여 입력해주세요.");
            return false;
        }

        return true;
    };

    useEffect(() => {
        setCorrectPw(chkPwd(password));
    }, [password]);

    const sendCode = async () => {
        let profilePhone = "";
        if (phoneNumber[0] === "0") {
            profilePhone = "+82" + phoneNumber.split("-").join("").slice(1);
        } else if (phoneNumber[0] === "1") {
            //test phone number
            profilePhone = "+" + phoneNumber.split("-").join("");
        }
        const phoneProvider = new firebase.auth.PhoneAuthProvider();
        await phoneProvider.verifyPhoneNumber(profilePhone, appVerifier.current).then((id) => {
            setVerificationId(id);
            Alert.alert("성공", "인증 문자를 보냈습니다.", [{ text: "확인" }], {
                cancelable: false,
            });
        });
    };

    const submitForVerify = async () => {
        const phoneCredential = firebase.auth.PhoneAuthProvider.credential(
            verificationId,
            verifyCode
        );
        await myBase
            .auth()
            .signInWithCredential(phoneCredential)
            .then((user) => {
                if (user.additionalUserInfo.isNewUser) {
                    Alert.alert("경고", "존재하지 않는 휴대폰 번호입니다.", [{ text: "확인" }], {
                        cancelable: false,
                    });
                    myBase.auth().currentUser.delete();
                    setPhoneNumber("");
                    setVerificationId("");
                    setVerifyCode("");
                } else {
                    setPassword("");
                    setChkPassword("");
                    setModalChangePw(true);
                }
            })
            .catch((error) => {
                console.log(error);
                if (error.code === "auth/invalid-verification-code") {
                    setVerifyCode("");
                    Alert.alert("경고", "인증 코드를 잘못 입력하였습니다.", [{ text: "확인" }], {
                        cancelable: false,
                    });
                } else {
                    setPhoneNumber("");
                    setVerificationId("");
                    setVerifyCode("");
                    Alert.alert(
                        "경고",
                        `오류가 발생했습니다.\nError Code: ${error.code}`,
                        [{ text: "확인" }],
                        {
                            cancelable: false,
                        }
                    );
                }
            });
    };

    const submitForUpdate = async () => {
        await myBase
            .auth()
            .currentUser.updatePassword(password)
            .then(() => {
                Alert.alert("성공", "비밀번호가 초기화되었습니다.", [{ text: "확인" }], {
                    cancelable: false,
                });
                navigation.goBack();
            })
            .catch((error) => {
                console.log(error);
                Alert.alert(
                    "경고",
                    `오류가 발생했습니다.\nError Code: ${error.code}`,
                    [{ text: "확인" }],
                    { cancelable: false }
                );
            });
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <FirebaseRecaptchaVerifierModal
                ref={appVerifier}
                firebaseConfig={myBase.options}
                cancelLabel="취소"
            />
            <TouchableOpacity
                style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 30 }}
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
                    enabled={!modalChangePw}
                >
                    <View style={{ marginBottom: 5 }}>
                        <View style={{ marginBottom: 5, flexDirection: "row" }}>
                            <TextInput
                                style={{ flex: 9 }}
                                label="휴대폰 번호"
                                mode="outlined"
                                dense={true}
                                placeholder="010-0000-0000"
                                keyboardType="phone-pad"
                                maxLength={13}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                            />
                            <Button
                                mode="contained"
                                style={{
                                    flex: 1,
                                    marginTop: 5,
                                    marginLeft: 6,
                                    justifyContent: "center",
                                }}
                                labelStyle={TextFamily.NanumBold}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    sendCode();
                                }}
                                disabled={phoneNumber.length === 0}
                            >
                                전송
                            </Button>
                        </View>
                        <View>
                            <TextInput
                                label="인증코드"
                                dense={true}
                                mode="outlined"
                                placeholder="123456"
                                keyboardType="phone-pad"
                                maxLength={6}
                                editable={verificationId !== ""}
                                value={verifyCode}
                                onChangeText={setVerifyCode}
                                onChange={(e) => {
                                    if (e.nativeEvent.text.length === 6) {
                                        Keyboard.dismiss();
                                    }
                                }}
                            />
                            {verificationId !== "" && (
                                <HelperText type="info" visible={true}>
                                    인증 문자가 전송되었습니다.
                                </HelperText>
                            )}
                        </View>
                    </View>
                    <View>
                        <Button
                            mode="contained"
                            disabled={!verificationId && !verifyCode}
                            onPress={submitForVerify}
                        >
                            확인
                        </Button>
                    </View>
                    <View
                        style={{
                            width: "100%",
                            alignItems: "center",
                            marginTop: 10,
                        }}
                    >
                        <FirebaseRecaptchaBanner />
                    </View>
                </KeyboardAvoidingView>
            </TouchableOpacity>

            <Modal
                isVisible={modalChangePw}
                style={{ justifyContent: "flex-end", margin: 0 }}
                avoidKeyboard={true}
            >
                <View
                    style={{
                        height: hp("45%"),
                        backgroundColor: "white",
                    }}
                >
                    <View
                        style={{
                            height: hp("5%"),
                            backgroundColor: theme.colors.primary,
                        }}
                    />
                    <TouchableOpacity
                        style={{
                            alignSelf: "stretch",
                            height: hp("40%"),
                            paddingTop: 10,
                        }}
                        onPress={Keyboard.dismiss}
                        accessible={false}
                        activeOpacity={1}
                    >
                        <View
                            style={{
                                paddingHorizontal: 30,
                            }}
                        >
                            <Text style={TextSize.largeSize}>
                                {myBase.auth().currentUser !== null
                                    ? myBase.auth().currentUser.displayName
                                    : "Error"}
                                님의 계정 비밀번호 초기화
                            </Text>
                            <View style={{ marginBottom: 5 }}>
                                <TextInput
                                    label="비밀번호"
                                    mode="outlined"
                                    dense={true}
                                    secureTextEntry={true}
                                    value={password}
                                    onChangeText={setPassword}
                                    error={!correctPw && password}
                                    onFocus={(e) => {
                                        setShowPasswordText(true);
                                    }}
                                    onBlur={(e) => {
                                        setShowPasswordText(false);
                                    }}
                                />
                                {showPasswordText && (
                                    <HelperText type="info" visible={true}>
                                        길이는 8자 이상 15자 이하이며{"\n"}영문, 숫자, 특수문자 중
                                        2가지 이상을 혼합하여 입력해주세요
                                    </HelperText>
                                )}
                            </View>
                            <View style={{ marginBottom: 5 }}>
                                <TextInput
                                    label="비밀번호 확인"
                                    secureTextEntry={true}
                                    value={chkPassword}
                                    onChangeText={setChkPassword}
                                    error={!checkPw && password}
                                    mode="outlined"
                                    dense={true}
                                    onFocus={(e) => {
                                        setShowCheckPasswordText(true);
                                    }}
                                    onBlur={(e) => {
                                        setShowCheckPasswordText(false);
                                    }}
                                />
                                {showCheckPasswordText && !checkPw ? (
                                    <HelperText type="error" visible={true}>
                                        비밀번호가 일치하지 않습니다.
                                    </HelperText>
                                ) : null}
                            </View>
                            <Button
                                mode="contained"
                                disabled={!password || !chkPassword || !checkPw || !correctPw}
                                onPress={submitForUpdate}
                            >
                                확인
                            </Button>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};
