import React, { useEffect, useState } from "react";
import { View, Button, Text, StyleSheet } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import base64 from "base-64";

export default QRScan = ({ navigation }) => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const requestPermission = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === "granted");
        };
        requestPermission();
    }, []);

    const handleCodeScanned = ({ type, data }) => {
        setScanned(true);
        alert(`type: ${type}\ndata: ${data}`);
        let toGo = data;
        for (let i = 0; i < 3; i++) {
            toGo = base64.decode(toGo);
        }
        navigation.replace(toGo);
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
                <Text>Can't access camera</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleCodeScanned}
                style={StyleSheet.absoluteFillObject}
            />
            {scanned && <Button title={"Tap to Scan Again"} onPress={() => setScanned(false)} />}
        </View>
    );
};
