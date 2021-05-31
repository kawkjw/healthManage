import React, { useContext, useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Keyboard, Alert, Platform } from "react-native";
import { AuthContext } from "../Auth";
import myBase, { db } from "../../config/MyBase";
import firebase from "firebase";
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from "expo-firebase-recaptcha";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TextInput, Button, HelperText, Checkbox } from "react-native-paper";
import { TextFamily, theme } from "../../css/MyStyles";

export default SignUp = ({ navigation }) => {
    const appVerifier = useRef(null);
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [verificationId, setVerificationId] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [chkPassword, setChkPassword] = useState("");
    const [selected, setSelected] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [chkUsedId, setChkUsedId] = useState(false);
    const [checkPw, setCheckPw] = useState(false);
    const [correctPw, setCorrectPw] = useState(false);

    const { signUp } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [showPasswordText, setShowPasswordText] = useState(false);
    const [showCheckPasswordText, setShowCheckPasswordText] = useState(false);

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

    useEffect(() => {
        setName(checkId(name));
    }, [name]);

    useEffect(() => {
        setPhoneNumber(
            phoneNumber
                .replace(/[^0-9]/g, "")
                .replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3")
                .replace("--", "-")
        );
    }, [phoneNumber]);

    const checkUsedId = async () => {
        if (id) {
            if (id.length < 8) {
                Alert.alert(
                    "경고",
                    "아이디는 8자 이상으로 해주시기 바랍니다.",
                    [{ text: "확인" }],
                    { cancelable: false }
                );
                return;
            }
            await db
                .collection("ids")
                .where("id", "==", id)
                .get()
                .then((snapshot) => {
                    let data = {};
                    snapshot.forEach((doc) => {
                        data = doc.data();
                    });
                    if (Object.keys(data).length === 0) {
                        setChkUsedId(true);
                        Alert.alert("성공", "사용하셔도 됩니다.", [{ text: "확인" }], {
                            cancelable: false,
                        });
                    } else {
                        Alert.alert(
                            "경고",
                            "이미 사용된 아이디 입니다.",
                            [
                                {
                                    text: "확인",
                                    onPress: () => {
                                        setId("");
                                        setChkUsedId(false);
                                    },
                                },
                            ],
                            { cancelable: false }
                        );
                    }
                })
                .catch((error) => console.log(error));
        } else {
            Alert.alert("경고", "아이디를 입력해주세요.", [{ text: "확인" }], {
                cancelable: false,
            });
        }
    };

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

    const submit = async () => {
        setLoading(true);
        await signUp({
            name,
            phoneNumber,
            userId: id,
            password,
            adminCode,
            verifyCode,
            verificationId,
        })
            .then(() => {
                navigation.goBack();
            })
            .catch((error) => {
                setLoading(false);
                console.log(error);
            });
    };

    return (
        <View style={{ flex: 1 }}>
            <FirebaseRecaptchaVerifierModal
                ref={appVerifier}
                firebaseConfig={myBase.options}
                cancelLabel="취소"
            />
            <View style={{ height: hp("2%") }}></View>
            <KeyboardAwareScrollView
                contentContainerStyle={{ paddingHorizontal: -30 }}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                extraHeight={Platform.select({ android: 150 })}
                enableOnAndroid={true}
                enableAutomaticScroll
                extraScrollHeight={120}
            >
                <TouchableOpacity
                    style={{ height: hp("88%"), paddingHorizontal: 30 }}
                    onPress={Keyboard.dismiss}
                    accessible={false}
                    activeOpacity={1}
                >
                    <View style={{ marginBottom: 5 }}>
                        <TextInput
                            label="이름"
                            mode="outlined"
                            dense={true}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>
                    <View style={{ marginBottom: 5 }}>
                        <View style={{ flexDirection: "row" }}>
                            <View style={{ flex: 9 }}>
                                <TextInput
                                    label="아이디"
                                    value={id}
                                    onChangeText={setId}
                                    mode="outlined"
                                    style={{ marginBottom: 0 }}
                                    dense={true}
                                    error={id.length < 8 && id}
                                />
                            </View>
                            <Button
                                style={{
                                    flex: 1,
                                    marginTop: 5,
                                    marginLeft: 6,
                                    justifyContent: "center",
                                }}
                                onPress={checkUsedId}
                                mode="contained"
                                labelStyle={TextFamily.NanumBold}
                                disabled={!id}
                            >
                                중복확인
                            </Button>
                        </View>
                        {id.length < 8 && id ? (
                            <HelperText type="error" visible={true} padding="none">
                                아이디는 8자 이상으로 해주시기 바랍니다.
                            </HelperText>
                        ) : null}
                    </View>
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
                                길이는 8자 이상 15자 이하이며{"\n"}영문, 숫자, 특수문자 중 2가지
                                이상을 혼합하여 입력해주세요
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
                    <View>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Checkbox.Android
                                status={selected ? "checked" : "unchecked"}
                                onPress={() => setSelected(!selected)}
                            />
                            <Button
                                mode="text"
                                onPress={() => setSelected(!selected)}
                                labelStyle={{
                                    marginHorizontal: 5,
                                    marginVertical: 5,
                                    color: "black",
                                }}
                            >
                                관리자 코드 입력
                            </Button>
                        </View>
                        {selected && (
                            <View style={{ marginBottom: 5 }}>
                                <TextInput
                                    dense={true}
                                    label="관리자 코드"
                                    placeholder="00000000"
                                    keyboardType="phone-pad"
                                    mode="outlined"
                                    maxLength={8}
                                    value={adminCode}
                                    onChangeText={setAdminCode}
                                />
                            </View>
                        )}
                    </View>
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
                            onPress={() => submit()}
                            loading={loading}
                            disabled={
                                !name ||
                                !phoneNumber ||
                                !id ||
                                !password ||
                                !chkPassword ||
                                !chkUsedId ||
                                password !== chkPassword ||
                                !correctPw ||
                                !verifyCode ||
                                !verificationId
                            }
                        >
                            회원가입
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
                </TouchableOpacity>
            </KeyboardAwareScrollView>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
