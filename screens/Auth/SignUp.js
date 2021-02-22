import React, { useContext, useEffect, useRef, useState } from "react";
import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Keyboard,
    Alert,
    ActivityIndicator,
} from "react-native";
import { AuthContext } from "../Auth";
import { AuthStyles } from "../../css/MyStyles";
import CheckBox from "../../config/CheckBox";
import myBase, { db } from "../../config/MyBase";
import firebase from "firebase";
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from "expo-firebase-recaptcha";
import { RFPercentage } from "react-native-responsive-fontsize";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import RadioForm, {
    RadioButton,
    RadioButtonInput,
    RadioButtonLabel,
} from "react-native-simple-radio-button";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SegmentedPicker from "react-native-segmented-picker";
import Postcode from "react-native-daum-postcode";
import Modal from "react-native-modal";

export default SignUp = ({ navigation }) => {
    const appVerifier = useRef(null);
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [verificationId, setVerificationId] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [chkPassword, setChkPassword] = useState("");
    const [selected, setSelected] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [checkEmail, setCheckEmail] = useState(false);
    const [chkUsedEmail, setChkUsedEmail] = useState(false);
    const [checkPw, setCheckPw] = useState(false);
    const [correctPw, setCorrectPw] = useState(false);
    const [sexSelected, setSexSelected] = useState(-1);
    const radioOptions = [
        { label: "남", value: "man" },
        { label: "여", value: "woman" },
    ];
    const today = new Date();
    const picker = useRef();
    const [birthday, setBirthday] = useState({
        year: today.getFullYear().toString(),
        month: (today.getMonth() + 1).toString(),
        day: today.getDate().toString(),
    });
    const pickerBirthday = {
        year: [...Array(today.getFullYear() - 1930 + 1).keys()].map((d) => ({
            label: (d + 1930).toString(),
            value: (d + 1930).toString(),
            key: (d + 1930).toString(),
        })),
        month: [...Array(12).keys()].map((d) => ({
            label: (d + 1).toString(),
            value: (d + 1).toString(),
            key: (d + 1).toString(),
        })),
        day: [...Array(31).keys()].map((d) => ({
            label: (d + 1).toString(),
            value: (d + 1).toString(),
            key: (d + 1).toString(),
        })),
    };
    const [address, setAddress] = useState("");
    const [modalAddress, setModalAddress] = useState(false);
    const [webLoading, setWebLoading] = useState(true);

    const { signUp } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

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
                .replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/, "$1-$2-$3")
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
                        Alert.alert("성공", "사용하셔도 됩니다.", [{ text: "확인" }]);
                    } else {
                        Alert.alert("경고", "이미 사용된 이메일 주소 입니다.", [
                            {
                                text: "확인",
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
            Alert.alert("경고", "이메일 주소를 입력해주세요.", [{ text: "확인" }]);
        } else {
            Alert.alert("경고", "잘못된 이메일 주소입니다.", [{ text: "확인" }]);
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
            Alert.alert("성공", "인증 문자를 보냈습니다.", [{ text: "확인" }]);
        });
    };

    const submit = async () => {
        setLoading(true);
        await signUp({
            name,
            phoneNumber,
            email,
            password,
            adminCode,
            verifyCode,
            verificationId,
            sexSelected,
            birthday,
            address,
        })
            .then(() => {
                navigation.goBack();
            })
            .catch((error) => {
                setLoading(false);
                console.log(error);
            });
    };

    const generateOptions = () => {
        const { year, month, day } = pickerBirthday;
        const finalDate = new Date(birthday.year, birthday.month, 0).getDate();
        return [
            {
                key: "year",
                items: year,
            },
            {
                key: "month",
                items: month,
            },
            {
                key: "day",
                items: pickerBirthday.day.slice(0, finalDate),
            },
        ];
    };

    return (
        <SafeAreaView style={AuthStyles.container}>
            <FirebaseRecaptchaVerifierModal
                ref={appVerifier}
                firebaseConfig={myBase.options}
                attemptInvisibleVerification={true}
            />
            <Modal
                isVisible={modalAddress}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => setModalAddress(false)}
            >
                <View
                    style={{
                        backgroundColor: "white",
                        height: hp("85%"),
                    }}
                >
                    {webLoading && <ActivityIndicator />}
                    <Postcode
                        style={{ flex: 1 }}
                        jsOptions={{ animation: false }}
                        onSelected={(data) => {
                            setAddress(data.jibunAddress.split(" ").slice(0, -1).join(" "));
                            setModalAddress(false);
                        }}
                        onLoad={() => setWebLoading(false)}
                        renderLoading={() => {
                            return <ActivityIndicator />;
                        }}
                    />
                </View>
            </Modal>
            <KeyboardAwareScrollView
                style={{ alignSelf: "stretch" }}
                contentContainerStyle={{ height: hp("90%") }}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                extraScrollHeight={120}
            >
                <TouchableOpacity
                    style={AuthStyles.touchScreen}
                    onPress={Keyboard.dismiss}
                    accessible={false}
                    activeOpacity={1}
                >
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>이름</Text>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TextInput
                                style={[AuthStyles.textInput, { flex: 1 }]}
                                placeholder="이름"
                                autoCompleteType="name"
                                keyboardType="default"
                                textContentType="name"
                                value={name}
                                onChangeText={setName}
                            />
                            <RadioForm formHorizontal={true} animation={true}>
                                {radioOptions.map((option, index) => (
                                    <View key={index}>
                                        <RadioButton
                                            labelHorizontal={true}
                                            wrapStyle={{
                                                marginLeft: 10,
                                            }}
                                        >
                                            <RadioButtonInput
                                                obj={option}
                                                index={index}
                                                isSelected={sexSelected === index}
                                                onPress={() => {
                                                    setSexSelected(index);
                                                }}
                                                buttonSize={15}
                                                buttonInnerColor={"black"}
                                                buttonOuterColor={"black"}
                                                buttonStyle={{ borderWidth: 1 }}
                                            />
                                            <RadioButtonLabel
                                                obj={option}
                                                index={index}
                                                onPress={() => {
                                                    setSexSelected(index);
                                                }}
                                                labelStyle={{
                                                    fontSize: RFPercentage(2.5),
                                                    marginLeft: 5,
                                                }}
                                            />
                                        </RadioButton>
                                    </View>
                                ))}
                            </RadioForm>
                        </View>
                    </View>
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>이메일</Text>
                        <View style={{ flexDirection: "row" }}>
                            <TextInput
                                style={[
                                    AuthStyles.textInput,
                                    email
                                        ? checkEmail
                                            ? { backgroundColor: "green" }
                                            : { backgroundColor: "red" }
                                        : undefined,
                                    { flex: 3, marginRight: 10 },
                                ]}
                                placeholder="examples@example.com"
                                autoCompleteType="email"
                                keyboardType="email-address"
                                textContentType="emailAddress"
                                value={email}
                                onChangeText={setEmail}
                            />
                            <TouchableOpacity
                                style={AuthStyles.authButton}
                                onPress={checkUsedEmail}
                            >
                                <Text style={AuthStyles.authText}>중복확인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>비밀번호</Text>
                        <Text style={{ color: "#8c8c8c", marginBottom: 5 }}>
                            길이는 8자 이상 15자 이하이며{"\n"}영문, 숫자, 특수문자 중 2가지 이상을
                            혼합하여 입력해주세요
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
                            placeholder="비밀번호"
                            secureTextEntry={true}
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>비밀번호 확인</Text>
                        <TextInput
                            style={[
                                AuthStyles.textInput,
                                password
                                    ? checkPw
                                        ? { backgroundColor: "green" }
                                        : { backgroundColor: "red" }
                                    : undefined,
                            ]}
                            placeholder="비밀번호 확인"
                            secureTextEntry={true}
                            value={chkPassword}
                            onChangeText={setChkPassword}
                        />
                    </View>
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>생년월일</Text>
                        <View
                            style={{
                                flexDirection: "row",
                                borderWidth: 1,
                                alignItems: "center",
                            }}
                        >
                            <View style={{ flex: 2, alignItems: "center" }}>
                                <Text style={{ fontSize: RFPercentage(2.5) }}>{birthday.year}</Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <Text style={{ fontSize: RFPercentage(2.5) }}>{" / "}</Text>
                            </View>
                            <View style={{ flex: 2, alignItems: "center" }}>
                                <Text style={{ fontSize: RFPercentage(2.5) }}>
                                    {birthday.month}
                                </Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <Text style={{ fontSize: RFPercentage(2.5) }}>{" / "}</Text>
                            </View>
                            <View style={{ flex: 2, alignItems: "center" }}>
                                <Text style={{ fontSize: RFPercentage(2.5) }}>{birthday.day}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    Keyboard.dismiss();
                                    picker.current.show();
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
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>주소</Text>
                        <View style={{ flexDirection: "row" }}>
                            <TextInput
                                style={[AuthStyles.textInput, { marginRight: 5, flex: 2 }]}
                                placeholder="경기도 오산시 궐동"
                                keyboardType="default"
                                value={address}
                                onChangeText={setAddress}
                                editable={false}
                            />
                            <TouchableOpacity
                                style={[AuthStyles.authButton, { marginLeft: 5 }]}
                                onPress={() => setModalAddress(true)}
                            >
                                <Text style={AuthStyles.authText}>주소 검색</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={AuthStyles.textView}>
                        <CheckBox
                            selected={selected}
                            onPress={() => {
                                setSelected(!selected);
                                Keyboard.dismiss();
                            }}
                            text=" 관리자 코드 입력"
                            textStyle={{ fontSize: RFPercentage(2) }}
                            size={RFPercentage(2.5)}
                            style={[{ width: "40%" }, selected && { marginBottom: 10 }]}
                        />
                        {selected ? (
                            <>
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
                    <View style={AuthStyles.textView}>
                        <Text style={AuthStyles.text}>휴대폰 번호</Text>
                        <View style={{ marginBottom: 5, flexDirection: "row" }}>
                            <TextInput
                                style={[AuthStyles.textInput, { flex: 3, marginRight: 7 }]}
                                placeholder="010-0000-0000"
                                autoCompleteType="tel"
                                keyboardType="phone-pad"
                                textContentType="telephoneNumber"
                                maxLength={13}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                            />
                            <TouchableOpacity
                                style={AuthStyles.authButton}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    sendCode();
                                }}
                                disabled={phoneNumber.length === 0}
                            >
                                <Text style={AuthStyles.authText}>전송</Text>
                            </TouchableOpacity>
                        </View>
                        <View>
                            {verificationId !== "" && (
                                <Text style={{ marginBottom: 5 }}>인증 문자 확인해주세요</Text>
                            )}
                            <TextInput
                                style={AuthStyles.textInput}
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
                        </View>
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
                                !correctPw ||
                                !verifyCode ||
                                !verificationId ||
                                sexSelected === -1 ||
                                Number(birthday.year) === today.getFullYear() ||
                                !address
                            }
                            onPress={() => submit()}
                        >
                            {loading ? (
                                <ActivityIndicator />
                            ) : (
                                <Text style={AuthStyles.authText}>회원가입</Text>
                            )}
                        </TouchableOpacity>
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
            <SegmentedPicker
                ref={picker}
                onConfirm={(select) => {
                    setBirthday({ ...birthday, day: select.day });
                }}
                onValueChange={(select) => {
                    if (select.column === "year") {
                        setBirthday({ ...birthday, year: select.value });
                    } else if (select.column === "month") {
                        setBirthday({ ...birthday, month: select.value });
                    }
                }}
                confirmText="확인"
                defaultSelections={birthday}
                options={generateOptions()}
            />
        </SafeAreaView>
    );
};
