import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Navigation, MapPin, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn, toArabicNumerals } from "@/lib/utils";

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number) {
  return (rad * 180) / Math.PI;
}

function calculateQibla(lat: number, lng: number): number {
  const phiK = toRadians(KAABA_LAT);
  const lambdaK = toRadians(KAABA_LNG);
  const phi = toRadians(lat);
  const lambda = toRadians(lng);
  const bearing = toDegrees(
    Math.atan2(
      Math.sin(lambdaK - lambda),
      Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
    )
  );
  return (bearing + 360) % 360;
}

export default function QiblaPage() {
  const navigate = useNavigate();
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("الجهاز لا يدعم تحديد الموقع");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const bearing = calculateQibla(pos.coords.latitude, pos.coords.longitude);
        setQiblaBearing(bearing);
        setLocationGranted(true);
      },
      () => setError("يرجى السماح بالوصول إلى الموقع لتحديد اتجاه القبلة"),
      { enableHighAccuracy: true }
    );
  }, []);

  // Device orientation
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // @ts-ignore – webkitCompassHeading is Safari-specific
      const compassHeading = e.webkitCompassHeading ?? (e.alpha !== null ? (360 - e.alpha) % 360 : null);
      if (compassHeading !== null) setHeading(compassHeading);
    };

    // iOS 13+ requires permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((response: string) => {
          if (response === "granted") {
            window.addEventListener("deviceorientation", handleOrientation, true);
          } else {
            setError("يرجى السماح بالوصول إلى البوصلة");
          }
        })
        .catch(() => setError("تعذر الوصول إلى مستشعر الاتجاه"));
    } else {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }

    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  const needleRotation = qiblaBearing !== null && heading !== null
    ? qiblaBearing - heading
    : 0;

  return (
    <div className="px-4 pt-6 pb-24 flex flex-col items-center">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3 self-start w-full">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="rounded-xl p-2.5 hover:bg-muted transition-colors">
          <ArrowRight className="h-5 w-5" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold heading-decorated">اتجاه القبلة</h1>
          <p className="text-sm text-muted-foreground">البوصلة نحو الكعبة المشرفة</p>
        </div>
      </div>

      {error ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-destructive/10 p-8 text-center w-full">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-destructive text-sm">{error}</p>
        </motion.div>
      ) : (
        <>
          {/* Compass */}
          <div className="relative w-72 h-72 mb-8">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-border/50 shadow-elevated" />
            {/* Cardinal directions */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: heading !== null ? -heading : 0 }}
                transition={{ type: "spring", stiffness: 60, damping: 20 }}
                className="relative w-64 h-64"
              >
                {/* N/S/E/W labels */}
                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-destructive">N</span>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-bold text-muted-foreground">S</span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">E</span>
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">W</span>
                
                {/* Tick marks */}
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-0 origin-[center_128px]"
                    style={{ transform: `translateX(-50%) rotate(${i * 10}deg)` }}
                  >
                    <div className={cn(
                      "w-px mx-auto",
                      i % 9 === 0 ? "h-3 bg-foreground/60" : "h-1.5 bg-border"
                    )} />
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Qibla needle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: needleRotation }}
                transition={{ type: "spring", stiffness: 60, damping: 20 }}
                className="relative w-full h-full"
              >
                {/* Needle pointing up */}
                <div className="absolute left-1/2 top-8 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-1 h-24 rounded-full bg-gradient-to-b from-primary to-primary/30" />
                </div>
                {/* Kaaba icon at top */}
                <div className="absolute left-1/2 top-3 -translate-x-1/2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow">
                    <span className="text-primary-foreground text-sm">🕋</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-primary shadow-glow border-2 border-primary-foreground" />
            </div>
          </div>

          {/* Bearing info */}
          {qiblaBearing !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card p-5 shadow-elevated border border-border/50 w-full text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">اتجاه القبلة</span>
              </div>
              <p className="text-3xl font-bold text-primary">{toArabicNumerals(Math.round(qiblaBearing))}°</p>
              {heading === null && (
                <p className="text-xs text-muted-foreground mt-2">
                  حرّك جهازك لتفعيل البوصلة أو استخدم الزاوية أعلاه
                </p>
              )}
            </motion.div>
          )}

          {!locationGranted && !error && (
            <div className="flex items-center gap-2 mt-4 text-muted-foreground">
              <Navigation className="h-4 w-4 animate-pulse" />
              <span className="text-sm">جارٍ تحديد الموقع...</span>
            </div>
          )}
        </>
      )}

      <div className="h-4" />
    </div>
  );
}
