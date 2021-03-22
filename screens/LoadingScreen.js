import React from "react";
import { View, StyleSheet, StatusBar, Platform } from "react-native";
import { ActivityIndicator, Colors } from "react-native-paper";

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
                <ActivityIndicator
                    style={{ width: 50, height: 50 }}
                    animating={true}
                    color={Colors.black}
                    size="large"
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
