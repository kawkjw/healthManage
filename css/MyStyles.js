import { StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { DefaultTheme } from "react-native-paper";

export const theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, primary: "#263143", accent: "#374862" },
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
        width: wp("90%"),
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
