import { StyleSheet, Platform } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";

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
        alignItems: "center",
        padding: 20,
    },
    image: {
        resizeMode: "stretch",
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
        marginBottom: 3,
        fontSize: RFPercentage(1.9),
    },
    flexCenter: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    surface: { elevation: 6, marginBottom: 20, borderRadius: 20 },
    menu: {
        width: wp("90%"),
        height: hp("10%"),
        alignItems: "center",
        justifyContent: "center",
    },
    menuRatio1: {
        width: wp("90%"),
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});

export const AuthStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    touchScreen: {
        alignSelf: "stretch",
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    textInput: {
        borderWidth: 1,
        padding: 5,
        fontSize: RFPercentage(2.2),
    },
    text: {
        fontSize: RFPercentage(1.9),
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
        fontSize: RFPercentage(1.9),
        color: "#1e90ff",
    },
});

export const TextSize = StyleSheet.create({
    normalSize: { fontSize: RFPercentage(1.9) },
    largeSize: { fontSize: RFPercentage(2.2) },
    largerSize: { fontSize: RFPercentage(2.5) },
});
