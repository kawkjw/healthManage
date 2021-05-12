import React from "react";
import { FAB } from "react-native-paper";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default ToHome = ({ navigation }) => {
    return (
        <FAB
            style={{ position: "absolute", margin: 15, right: 0, bottom: hp("6%"), zIndex: 1 }}
            small
            icon="home"
            onPress={() => navigation.popToTop()}
        />
    );
};
