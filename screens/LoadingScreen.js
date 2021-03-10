import React from "react";
import { View, StyleSheet, StatusBar, Image, Platform } from "react-native";

export default LoadingScreen = () => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Image
                    style={{ width: 50, height: 50 }}
                    source={require("../assets/loading.gif")}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});
