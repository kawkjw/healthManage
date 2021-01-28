import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { db } from "../../../config/MyBase";
import moment from "moment";

export default ModifyUser = ({ route }) => {
    const { user } = route.params;
    const [isLoading, setIsLoading] = useState(true);
    const [membership, setMembership] = useState({});
    const [membershipKinds, setMembershipKinds] = useState([]);
    const getMembership = async () => {
        setIsLoading(true);
        await db
            .collection("users")
            .doc(user.uid)
            .collection("memberships")
            .orderBy("sort", "asc")
            .get()
            .then((snapshots) => {
                let kinds = [];
                let temp = {};
                snapshots.forEach((snapshot) => {
                    kinds.push(snapshot.id);
                    temp[snapshot.id] = snapshot.data();
                });
                setMembershipKinds(kinds);
                setMembership(temp);
            });
        setIsLoading(false);
    };
    const enToKo = (s) => {
        switch (s) {
            case "health":
                return "헬스";
            case "spinning":
                return "스피닝";
            case "yoga":
                return "요가";
            case "zoomba":
                return "줌바";
            case "squash":
                return "스쿼시";
            case "pilates":
                return "필라테스";
            case "pt":
                return "PT";
        }
    };
    const renderMembership = (kind, key) => {
        if (kind === "pt") {
            return (
                <View key={key}>
                    <Text>{enToKo(kind)}</Text>
                    <Text>
                        Start Date:{" "}
                        {moment(membership[kind].start.toDate()).format(
                            "YYYY. MM. DD."
                        )}
                    </Text>
                    <Text>Trainer: {membership[kind].trainer}</Text>
                    <Text>Count: {membership[kind].count}</Text>
                </View>
            );
        } else {
            return (
                <View key={key} style={{ marginBottom: 10 }}>
                    <Text>{enToKo(kind)}</Text>
                    <Text>
                        Membership Months: {membership[kind].month} months
                    </Text>
                    <Text>
                        Start Date:{" "}
                        {moment(membership[kind].start.toDate()).format(
                            "YYYY. MM. DD."
                        )}
                    </Text>
                    <Text>
                        End Date:{" "}
                        {moment(membership[kind].end.toDate()).format(
                            "YYYY. MM. DD."
                        )}
                    </Text>
                </View>
            );
        }
    };

    useEffect(() => {
        getMembership();
    }, []);

    return (
        <SafeAreaView>
            <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 17 }}>User Info</Text>
                <Text>Email: {user.email}</Text>
                {user.expoToken.map((token, index) => (
                    <Text key={index}>{token}</Text>
                ))}
                <Text>Name: {user.name}</Text>
                <Text>Permission: {user.permission}</Text>
                <Text>Phone Number: {user.phoneNumber}</Text>
                <Text>User ID: {user.uid}</Text>
            </View>

            <Text style={{ fontSize: 17 }}>Membership</Text>
            {isLoading
                ? undefined
                : membershipKinds.map((kind, index) =>
                      renderMembership(kind, index)
                  )}
        </SafeAreaView>
    );
};
