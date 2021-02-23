import React, { useEffect, useRef } from "react";
import { db } from "./MyBase";

export const useInterval = (callback, delay) => {
    const savedCallBack = useRef();

    useEffect(() => {
        savedCallBack.current = callback;
    }, [callback]);

    useEffect(() => {
        const tick = () => {
            savedCallBack.current();
        };
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
};

const getName = async (s) => {
    let ko = "";
    await db
        .collection("classNames")
        .doc(s)
        .get()
        .then((data) => {
            ko = data.data().ko;
        })
        .catch(() => {
            ko = "Error";
        });
    return ko;
};

export const enToKo = (s) => {
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
        case "pilates2":
            return "필라테스(주2회)";
        case "pilates3":
            return "필라테스(주3회)";
        case "pt":
            return "PT";
        case "gx":
            return "GX";
        case "GX":
            return "GX(요가, 줌바)";
        case "yoga.zoomba":
            return "(요가, 줌바)";
        case "Need to Set Up":
            return "여기를 눌러 설정해주세요.";
        default:
            return getName(s);
    }
};

export const enToMiniKo = (s) => {
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
        case "pilates2":
            return "필라테스";
        case "pilates3":
            return "필라테스";
        case "pt":
            return "PT";
        case "gx":
            return "GX";
        default:
            return "Error";
    }
};
