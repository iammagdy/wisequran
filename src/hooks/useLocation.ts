import { useState, useEffect, useCallback } from "react";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  timestamp: number;
}

interface UseLocationResult {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const CACHE_KEY = "wise-user-location";
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export function useLocation(autoFetch: boolean = false): UseLocationResult {
  const [location, setLocation] = useState<LocationData | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as LocationData;
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(!location);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("الجهاز لا يدعم تحديد الموقع");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const data: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };

        // Try reverse geocoding for city name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${data.latitude}&lon=${data.longitude}&format=json&accept-language=ar`
          );
          if (res.ok) {
            const json = await res.json();
            data.city = json.address?.city || json.address?.town || json.address?.village || json.address?.state;
          }
        } catch {}

        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        setLocation(data);
        setLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("يرجى السماح بالوصول إلى الموقع");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("تعذر تحديد الموقع");
            break;
          case err.TIMEOUT:
            setError("انتهت مهلة تحديد الموقع");
            break;
          default:
            setError("حدث خطأ في تحديد الموقع");
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: CACHE_DURATION }
    );
  }, []);

  useEffect(() => {
    if (!location) {
      if (autoFetch) {
        fetchLocation();
        return;
      }

      // Check if permission was already granted previously
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' })
          .then((result) => {
            if (result.state === 'granted') {
              fetchLocation();
            } else {
              setLoading(false); // Done checking, don't spin indefinitely
            }
          })
          .catch(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, [autoFetch, location, fetchLocation]);

  return { location, loading, error, refresh: fetchLocation };
}

// Haversine formula - distance between two points on Earth
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Magnetic declination approximation (simplified model)
export function getMagneticDeclination(lat: number, lon: number): number {
  // Simplified World Magnetic Model approximation
  // For accurate results, use a proper WMM library
  // This is a rough approximation for common use cases
  const year = new Date().getFullYear();
  const yearOffset = year - 2020;
  
  // Base declination varies by location (simplified)
  let declination = 0;
  
  // Middle East / North Africa region approximation
  if (lat > 10 && lat < 45 && lon > 20 && lon < 60) {
    declination = 3.5 + yearOffset * 0.1; // ~3-4 degrees east
  }
  // Europe
  else if (lat > 35 && lat < 70 && lon > -10 && lon < 40) {
    declination = -1 + yearOffset * 0.15;
  }
  // North America East
  else if (lat > 25 && lat < 50 && lon > -90 && lon < -60) {
    declination = -14 + yearOffset * 0.05;
  }
  // North America West
  else if (lat > 25 && lat < 50 && lon > -130 && lon < -90) {
    declination = 12 + yearOffset * 0.1;
  }
  // South Asia
  else if (lat > 5 && lat < 35 && lon > 60 && lon < 100) {
    declination = -1 + yearOffset * 0.05;
  }
  // Default: no significant declination
  else {
    declination = 0;
  }
  
  return declination;
}
