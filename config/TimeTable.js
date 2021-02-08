import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";

export default TimeTable = ({ classData, kind = "pt", style, ...props }) => {
    const [timeLabel, setTimeLabel] = useState([]);
    const [data, setData] = useState([]);

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
            default:
                return "Wrong";
        }
    };

    useEffect(() => {
        const initialTimeLabelList = () => {
            const start = 7;
            let list = [];
            for (let i = 0; i < 18; i++) {
                let temp = start + i;
                list.push(temp < 10 ? "0" + temp + ":00" : temp + ":00");
            }
            setTimeLabel(list);
        };
        const initialDataList = () => {
            let list = [];
            classData.forEach((v) => {
                let temp = {};
                temp["name"] = v.name;
                let classList = new Array(18).fill({});
                v.classes.map((c) => {
                    if (c !== -1) {
                        if (kind === "pt") {
                            classList[c.start - 7] = {
                                time: c.start < 10 ? "0" + c.start + ":00" : c.start + ":00",
                                kind: kind,
                                hasClass: true,
                                classInfo: {
                                    clientName: c.clientName,
                                    remainCount: c.remainCount,
                                },
                            };
                        }
                    }
                });
                temp["classes"] = classList;
                list.push(temp);
            });
            setData(list);
        };
        initialTimeLabelList();
        initialDataList();
    }, []);

    return (
        <SafeAreaView style={[{ backgroundColor: "white" }, style]}>
            <View
                style={{
                    flexDirection: "row",
                    borderBottomWidth: 1,
                    borderTopWidth: 1,
                }}
            >
                <View
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRightWidth: 1,
                    }}
                >
                    <View
                        style={{
                            height: hp("4%"),
                            justifyContent: "center",
                            borderBottomWidth: 1,
                            alignSelf: "stretch",
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: RFPercentage(2.5),
                            }}
                        >
                            Time
                        </Text>
                    </View>
                    {timeLabel.map((label, index) => (
                        <View
                            key={index}
                            style={[
                                {
                                    height: hp("4%"),
                                    alignItems: "center",
                                    alignSelf: "stretch",
                                    justifyContent: "center",
                                },
                                index !== timeLabel.length - 1
                                    ? {
                                          borderBottomWidth: 1,
                                          borderBottomColor: "#e6e6e6",
                                      }
                                    : undefined,
                            ]}
                        >
                            <Text
                                style={{
                                    fontSize: RFPercentage(2.5),
                                }}
                            >
                                {label}
                            </Text>
                        </View>
                    ))}
                </View>
                <View style={{ flex: 7 }}>
                    <ScrollView
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        scrollEnabled={data.length > 3}
                    >
                        {data.map((d, index) => (
                            <View
                                key={index}
                                style={[
                                    {
                                        width: wp("35%"),
                                        alignItems: "center",
                                    },
                                    index !== data.length - 1 ? { borderRightWidth: 1 } : undefined,
                                ]}
                            >
                                <View
                                    style={{
                                        height: hp("4%"),
                                        justifyContent: "center",
                                        alignItems: "center",
                                        alignSelf: "stretch",
                                        borderBottomWidth: 1,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: RFPercentage(2.5),
                                        }}
                                    >
                                        {d.name}
                                    </Text>
                                </View>
                                {d.classes.map((c, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            {
                                                alignSelf: "stretch",
                                                height: hp("4%"),
                                                alignItems: "center",
                                                justifyContent: "center",
                                            },
                                            index !== d.classes.length - 1
                                                ? {
                                                      borderBottomWidth: 1,
                                                      borderBottomColor: "#e6e6e6",
                                                  }
                                                : undefined,
                                            c.hasClass
                                                ? {
                                                      backgroundColor: "#99ccff",
                                                      borderWidth: 1,
                                                      borderColor: "#80bfff",
                                                  }
                                                : undefined,
                                        ]}
                                    >
                                        <Text>
                                            {c.hasClass
                                                ? c.kind === "pt"
                                                    ? c.classInfo.clientName +
                                                      " PT (" +
                                                      c.classInfo.remainCount +
                                                      "회 남음)"
                                                    : enToKo(c.classInfo.className) +
                                                      " (" +
                                                      c.classInfo.currentClient +
                                                      "/" +
                                                      c.classInfo.maxClient +
                                                      ")"
                                                : undefined}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
};
