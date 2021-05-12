import React, { useEffect, useState } from "react";
import { View, Text, AppState, TouchableOpacity, Image, Dimensions } from "react-native";
import { Surface } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import myBase, { db } from "../config/MyBase";
import { MyStyles, TextSize, theme } from "../css/MyStyles";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useInterval } from "../config/hooks";

export default GenQR = () => {
    const { width } = Dimensions.get("screen");
    const uid = myBase.auth().currentUser !== null ? myBase.auth().currentUser.uid : "null";
    const [data, setData] = useState("");
    const delay = 15000;
    const [isRun, setIsRun] = useState(false);
    const [num, setNum] = useState(4);
    const [count, setCount] = useState(15);

    const createRandom = async () => {
        if (uid !== null) {
            const rcode = Math.random().toString(36).substr(2, 7);
            await db
                .collection("users")
                .doc(uid)
                .get()
                .then((user) => {
                    if (user.exists) {
                        user.ref.update({
                            random: rcode,
                        });
                        console.log(rcode);
                        setData(uid + " " + rcode);
                    }
                })
                .catch((error) => console.log(error));
        }
    };

    const resetRandom = async () => {
        if (uid !== null) {
            await db
                .collection("users")
                .doc(uid)
                .get()
                .then((user) => {
                    if (user.exists) {
                        if (user.data().random !== " ") {
                            user.ref.update({
                                random: " ",
                            });
                        }
                    }
                })
                .catch((error) => console.log("reset random", error.code));
        }
    };

    useEffect(() => {
        if (isRun) {
            setNum(4);
            createRandom();
        }
    }, [isRun]);

    const changeAppState = (state) => {
        if (state === "inactive" || state === "background") {
            setIsRun(false);
            resetRandom();
        }
    };

    useEffect(() => {
        AppState.addEventListener("change", changeAppState);
        return () => {
            resetRandom();
            AppState.removeEventListener("change", changeAppState);
        };
    }, []);

    useInterval(
        () => {
            setCount(15);
            if (num === 0) {
                setIsRun(false);
            } else {
                setNum(num - 1);
                createRandom();
            }
        },
        isRun ? delay : null
    );

    useInterval(
        () => {
            setCount(count === 0 ? 15 : count - 1);
        },
        isRun ? 1000 : null
    );

    return (
        <View style={[MyStyles.container, { justifyContent: "center" }]}>
            <Surface
                style={{
                    flex: 1,
                    elevation: 6,
                    borderRadius: 20,
                    marginVertical: 30,
                    justifyContent: "center",
                }}
            >
                <TouchableOpacity
                    style={[
                        {
                            alignItems: "center",
                            justifyContent: "center",
                        },
                        width >= 800
                            ? { width: wp("54%") }
                            : width >= 550
                            ? { width: wp("64%") }
                            : { width: wp("90%") },
                    ]}
                    onPress={() => {
                        setIsRun(!isRun);
                        setCount(15);
                    }}
                >
                    {isRun ? (
                        <>
                            <View
                                style={{
                                    alignItems: "center",
                                }}
                            >
                                {data.length > 0 ? (
                                    <QRCode
                                        value={data}
                                        size={
                                            width >= 800
                                                ? wp("44%")
                                                : width >= 550
                                                ? wp("52%")
                                                : wp("70%")
                                        }
                                        bgColor="#000000"
                                        fgColor="#FFFFFF"
                                    />
                                ) : undefined}

                                <Text style={[TextSize.largeSize, { marginTop: 10 }]}>
                                    유효시간 {isRun ? count : 0}초
                                </Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={TextSize.largeSize}>입장 코드 생성</Text>
                            <Image
                                style={[MyStyles.image, { width: wp("80%"), aspectRatio: 1 }]}
                                source={require("../assets/qrcode-test.png")}
                            />
                        </>
                    )}
                </TouchableOpacity>
            </Surface>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
