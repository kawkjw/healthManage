import React, { useEffect, useRef } from "react";

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
