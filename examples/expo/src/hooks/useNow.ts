import { useEffect, useState } from "react";

/** The wall clock, read again every `interval` milliseconds, for countdowns. */
export const useNow = (interval: number) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [interval]);

  return now;
};
