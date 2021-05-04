import React, { useContext, useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, SafeAreaView, Keyboard, Alert, Platform } from "react-native";
import { AuthContext } from "../Auth";
import myBase, { db } from "../../config/MyBase";
import firebase from "firebase";
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from "expo-firebase-recaptcha";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import SegmentedPicker from "react-native-segmented-picker";
import Modal from "react-native-modal";
import {
    TextInput,
    RadioButton,
    Button,
    HelperText,
    IconButton,
    Checkbox,
} from "react-native-paper";
import moment from "moment";
import { TextFamily, theme } from "../../css/MyStyles";
import Constants from "expo-constants";
import PostCode from "../../config/PostCode";

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
    const [sexSelected, setSexSelected] = useState(-1);
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
                items: day.slice(0, finalDate),
            },
        ];
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <FirebaseRecaptchaVerifierModal
                ref={appVerifier}
                firebaseConfig={myBase.options}
                cancelLabel="취소"
            />
            <Modal
                isVisible={modalAddress}
                style={{ justifyContent: "flex-end", margin: 0 }}
                onBackdropPress={() => setModalAddress(false)}
                onBackButtonPress={() => setModalAddress(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                    }}
                >
                    {Platform.OS === "ios" && (
                        <View
                            style={{
                                height: Constants.statusBarHeight,
                                backgroundColor: theme.colors.primary,
                            }}
                        />
                    )}
                    <View style={{ height: hp("5%"), backgroundColor: theme.colors.primary }}>
                        <Button
                            onPress={() => setModalAddress(false)}
                            style={{ width: wp("10%") }}
                            mode="text"
                            labelStyle={[
                                Platform.OS === "ios" ? { paddingVertical: 8 } : undefined,
                                { color: "white" },
                            ]}
                        >
                            닫기
                        </Button>
                    </View>
                    <PostCode
                        style={{ flex: 1 }}
                        jsOptions={{ animation: true }}
                        onSelected={(data) => {
                            setAddress(
                                data.autoJibunAddress === ""
                                    ? data.jibunAddress
                                    : data.autoJibunAddress
                            );
                            setModalAddress(false);
                        }}
                    />
                </View>
            </Modal>
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
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TextInput
                                label="이름"
                                style={{ flex: 1 }}
                                dense={true}
                                value={name}
                                onChangeText={setName}
                                mode="outlined"
                            />
                            <RadioButton.Group
                                onValueChange={(value) => setSexSelected(value)}
                                value={sexSelected}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                        }}
                                    >
                                        <RadioButton.Android value={0} color="#374862" />
                                        <Button
                                            mode="text"
                                            onPress={() => setSexSelected(0)}
                                            labelStyle={{ marginHorizontal: 5, marginVertical: 5 }}
                                            compact={true}
                                        >
                                            남
                                        </Button>
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                        }}
                                    >
                                        <RadioButton.Android value={1} color="#374862" />
                                        <Button
                                            mode="text"
                                            onPress={() => setSexSelected(1)}
                                            labelStyle={{ marginHorizontal: 5, marginVertical: 5 }}
                                            compact={true}
                                        >
                                            여
                                        </Button>
                                    </View>
                                </View>
                            </RadioButton.Group>
                        </View>
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
                    <View style={{ marginBottom: 5 }}>
                        <View
                            style={{
                                flexDirection: "row",
                            }}
                        >
                            <TextInput
                                label="생년월일"
                                value={moment(
                                    [birthday.year, birthday.month, birthday.day].join(" "),
                                    "YYYY M D"
                                ).format("YYYY. MM. DD.")}
                                editable={false}
                                mode="outlined"
                                style={{ flex: 1 }}
                                dense={true}
                            />
                            <IconButton
                                icon="calendar"
                                size={28}
                                color="#263143"
                                onPress={() => {
                                    Keyboard.dismiss();
                                    picker.current.show();
                                }}
                                style={{ marginBottom: 0 }}
                            />
                        </View>
                    </View>
                    <View style={{ marginBottom: 5 }}>
                        <View style={{ flexDirection: "row" }}>
                            <TextInput
                                label="주소 검색"
                                value={address}
                                editable={false}
                                mode="outlined"
                                onChangeText={setAddress}
                                style={{ flex: 1 }}
                                dense={true}
                            />
                            <IconButton
                                icon="map-search-outline"
                                size={28}
                                color="#263143"
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setModalAddress(true);
                                }}
                                style={{ marginBottom: 0 }}
                            />
                        </View>
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
                                !verificationId ||
                                sexSelected === -1 ||
                                Number(birthday.year) === today.getFullYear() ||
                                !address
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
            <SegmentedPicker
                ref={picker}
                onValueChange={({ column, value }) => {
                    if (column === "year") {
                        setBirthday({ ...birthday, year: value });
                    } else if (column === "month") {
                        setBirthday({ ...birthday, month: value });
                    } else {
                        setBirthday({ ...birthday, day: value });
                    }
                }}
                onCancel={(select) => {
                    setBirthday({ year: select.year, month: select.month, day: select.day });
                }}
                onConfirm={(select) => {
                    setBirthday({ year: select.year, month: select.month, day: select.day });
                }}
                confirmText="확인"
                defaultSelections={birthday}
                options={generateOptions()}
                toolbarBackgroundColor={theme.colors.primary}
                confirmTextColor="white"
            />
        </SafeAreaView>
    );
};
