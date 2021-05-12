import React, { useEffect, useState } from "react";
import { View, Button, Text, StyleSheet, Linking, Alert } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import base64 from "base-64";
import ToHome from "../../../components/ToHome";

export default QRScan = ({ navigation }) => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const routes = ["Test"];

    useEffect(() => {
        const requestPermission = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === "granted");
        };
        requestPermission();
    }, []);

    const handleCodeScanned = ({ type, data }) => {
        setScanned(true);
        if (type === "org.iso.QRCode") {
            let toGo = data;
            for (let i = 0; i < 3; i++) {
                toGo = base64.decode(toGo);
            }
            if (routes.includes(toGo)) {
                navigation.replace(toGo);
            } else {
                Alert.alert(
                    "경고",
                    "잘못된 QR코드 입니다.",
                    [{ text: "확인", onPress: () => setScanned(false) }],
                    { cancelable: false }
                );
            }
        } else {
            Alert.alert(
                "경고",
                "QR코드만 스캔해주시기 바랍니다.",
                [{ text: "확인", onPress: () => setScanned(false) }],
                { cancelable: false }
            );
        }
    };

    if (hasPermission === null) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Text>Requesting for camera permission</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Button title="카메라 권한이 없습니다." onPress={() => Linking.openSettings()} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <ToHome navigation={navigation} />
            <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleCodeScanned}
                style={StyleSheet.absoluteFillObject}
            />
            {scanned && <Button title={"Tap to Scan Again"} onPress={() => setScanned(false)} />}
        </View>
    );
};
