import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { calculatePrayerTimes } from "@/lib/prayer-times";
import { useLocation } from "@/hooks/useLocation";
import { toArabicNumerals } from "@/lib/utils";

export default function IftarCountdown() {
  const { location } = useLocation();
  const [remaining, setRemaining] = useState<number | null>(null); // seconds
  const [passed, setPassed] = useState(false);
  const notifiedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const options = location ?
      { latitude: location.latitude, longitude: location.longitude } :
      {};
      const times = calculatePrayerTimes(now, options);
      const [h, m] = times.maghrib.split(":").map(Number);

      const maghribSeconds = h * 3600 + m * 60;
      const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const diff = maghribSeconds - nowSeconds;

      if (diff <= 0) {
        setPassed(true);
        setRemaining(0);

        // Send notification once
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("حان وقت الإفطار! 🎉🍽️", {
              body: "اللهم لك صمت وعلى رزقك أفطرت",
              icon: "/icons/icon-192.png",
              dir: "rtl",
              lang: "ar"
            });
          }
        }
      } else {
        setPassed(false);
        setRemaining(diff);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [location]);

  // Reset notification flag at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        notifiedRef.current = false;
      }
    };
    const interval = setInterval(checkMidnight, 60_000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor(totalSeconds % 3600 / 60);
    const secs = totalSeconds % 60;
    return `${toArabicNumerals(hrs.toString().padStart(2, "0"))} : ${toArabicNumerals(mins.toString().padStart(2, "0"))} : ${toArabicNumerals(secs.toString().padStart(2, "0"))}`;
  };

  return (
    <Card className="border-amber-300/40 dark:border-amber-600/30 overflow-hidden">
      <CardContent className="p-4 text-center space-y-2">
        {passed ?
        <>
            <p className="text-2xl">🎉</p>
            <p className="text-lg font-bold text-foreground">حان وقت الإفطار!</p>
            <p className="text-xs text-muted-foreground">ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله</p>
          </> :
        remaining !== null ?
        <>
            <p className="text-xs text-muted-foreground">⏱️ باقي على الإفطار</p>
            <p className="text-2xl font-bold tracking-wider text-foreground font-sans" dir="ltr">
              {formatTime(remaining)}
            </p>
          </> :

        <p className="text-sm text-muted-foreground">جارٍ حساب الوقت...</p>
        }
      </CardContent>
    </Card>);

}