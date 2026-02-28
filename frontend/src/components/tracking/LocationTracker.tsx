import { useEffect, useRef } from 'react';

const UPDATE_INTERVAL_MS = 5_000; // 5 seconds (fast for testing)

function getJwtToken(): string | null {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('mindbridge_token') ||
    sessionStorage.getItem('token') ||
    null
  );
}

function buildApiUrl(pathname: string): string {
  const base =
    import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:5004/api`;
  return `${base.replace(/\/$/, '')}${pathname.startsWith('/api') ? pathname.replace('/api', '') : pathname}`;
}

/**
 * Wraps navigator.geolocation.getCurrentPosition in a Promise so we can
 * force a fresh fix on every tick instead of relying on watchPosition
 * (which may never re-fire indoors / on WiFi).
 */
function getFreshPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8_000,
      maximumAge: 0, // never use a cached fix
    });
  });
}

interface LocationTrackerProps {
  /** User ID for dev mode (when no JWT) */
  userId?: string;
}

/**
 * Silent background GPS tracker for elderly dashboard.
 * Forces a fresh getCurrentPosition every 5 s and posts to the backend.
 * Renders nothing — completely invisible to the user.
 */
const LocationTracker = ({ userId = '1' }: LocationTrackerProps) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('[LocationTracker] Geolocation not supported by this browser.');
      return undefined;
    }

    // Note: geolocation requires HTTPS in production
    if (
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      !window.location.hostname.startsWith('127.')
    ) {
      console.warn(
        '[LocationTracker] Geolocation may require HTTPS. If it fails, enable the Chrome flag for insecure origins.',
      );
    }

    const sendUpdate = async () => {
      tickRef.current += 1;
      const tick = tickRef.current;

      try {
        // Force a FRESH position from the browser every tick
        const position = await getFreshPosition();
        const { latitude, longitude, accuracy } = position.coords;

        console.log(
          `[LocationTracker] #${tick} lat=${latitude.toFixed(6)} lng=${longitude.toFixed(6)} acc=${accuracy?.toFixed(1)}m`,
        );

        const token = getJwtToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const body: Record<string, unknown> = { latitude, longitude, accuracy };
        if (!token && userId) body.userId = String(userId);

        const res = await fetch(buildApiUrl('/api/location/update'), {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          console.warn(`[LocationTracker] POST failed: ${res.status}`);
        }
      } catch (e) {
        console.warn('[LocationTracker] GPS / send error:', e);
      }
    };

    // First update after 1 s, then every UPDATE_INTERVAL_MS
    const firstTimer = setTimeout(sendUpdate, 1_000);
    intervalRef.current = setInterval(sendUpdate, UPDATE_INTERVAL_MS);

    console.log(`[LocationTracker] Started — update every ${UPDATE_INTERVAL_MS / 1000}s`);

    return () => {
      clearTimeout(firstTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId]);

  return null;
};

export default LocationTracker;
