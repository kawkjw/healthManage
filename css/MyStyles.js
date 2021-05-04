import { Dimensions, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { DefaultTheme, configureFonts } from "react-native-paper";

const { width } = Dimensions.get("screen");

const fontConfig = {
    web: {
        regular: {
            fontFamily: "NanumFontR",
            fontWeight: "normal",
        },
    },
    ios: {
        regular: {
            fontFamily: "NanumFontR",
            fontWeight: "normal",
        },
    },
    default: {
        regular: {
            fontFamily: "NanumFontR",
            fontWeight: "normal",
        },
    },
};

export const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, primary: "#263143", accent: "#374862" },
    fonts: configureFonts(fontConfig),
};

export const MyStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
    },
    image: {
        resizeMode: "stretch",
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
        width: width >= 800 ? wp("65%") : width >= 550 ? wp("70%") : wp("90%"),
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});

export const TextSize = StyleSheet.create({
    normalSize: { fontSize: RFPercentage(1.9) },
    largeSize: { fontSize: RFPercentage(2.2) },
    largerSize: { fontSize: RFPercentage(2.5) },
});

export const TextFamily = StyleSheet.create({
    NanumRegular: { fontFamily: "NanumFontR" },
    NanumBold: { fontFamily: "NanumFontB" },
});
