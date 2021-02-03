import { StyleSheet, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";

export const MyStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
    },
    buttonShadow: {
        backgroundColor: "white",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "grey",
        ...Platform.select({
            ios: {
                shadowColor: "#c6c6c6",
                shadowOffset: { width: 5, height: 5 },
                shadowOpacity: 5,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    profileButton: {
        aspectRatio: 1,
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    image: {
        aspectRatio: 1,
        marginTop: 10,
        resizeMode: "stretch",
    },
    phoneButton: {
        aspectRatio: 7 / 2,
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: {
        width: "50%",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
    },

    button: {
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    userinfo: {
        height: "36%",
        padding: 15,
    },
    profileText: {
        marginBottom: 5,
        fontSize: RFPercentage(2),
    },
});

export const AuthStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    touchScreen: {
        flex: 1,
        alignSelf: "stretch",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    textInput: {
        borderWidth: 1,
        padding: 5,
        fontSize: RFPercentage(2.5),
    },
    text: {
        fontSize: RFPercentage(2),
        marginBottom: 5,
    },
    textView: {
        marginBottom: 10,
    },
    authButton: {
        flex: 1,
        height: 35,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "grey",
        ...Platform.select({
            ios: {
                shadowColor: "#c6c6c6",
                shadowOffset: { width: 5, height: 5 },
                shadowOpacity: 5,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    authText: {
        fontSize: RFPercentage(2),
        color: "#1e90ff",
    },
});
