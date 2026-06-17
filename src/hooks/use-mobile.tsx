import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useDeviceProfile() {
  const [profile, setProfile] = React.useState({
    isMobile: false,
    isTouch: false,
    device: "desktop" as "mobile" | "desktop",
  });

  React.useEffect(() => {
    const update = () => {
      const isNarrow = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const isTouch = isCoarsePointer || navigator.maxTouchPoints > 0;
      const isMobile = isNarrow || (isTouch && window.innerWidth < 1024);

      setProfile({
        isMobile,
        isTouch,
        device: isMobile ? "mobile" : "desktop",
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return profile;
}
