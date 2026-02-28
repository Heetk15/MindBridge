import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import MBCard from '@/components/common/Card';
import { motion } from 'framer-motion';
import {
  MapPin, Navigation, Shield, AlertTriangle, Clock, RotateCw,
  CheckCircle, Lock, Unlock, Play, Square, MousePointerClick,
} from 'lucide-react';

// ── Fix Leaflet default marker icon for Vite (prevents 404 / broken icon) ──
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// ── Types ────────────────────────────────────────────────────────────────────

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  userId: string;
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  distance: number | null;
  isOutsideRadius: boolean;
  error: string | null;
  lastUpdate: Date | null;
  loading: boolean;
}

interface SafeZoneConfig {
  centerLat: number;
  centerLng: number;
  radius: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SAFE_RADIUS = 5; // metres – matches backend FALLBACK_RADIUS
const POLLING_INTERVAL = 3000; // 3 s
const DEFAULT_ELDERLY_USER_ID = '1';
const DEFAULT_MAP_ZOOM = 19;
const SIM_STEP_INTERVAL = 2000; // simulation sends a new point every 2s
const SIM_STEP_METERS = 2; // each simulation step moves ~2 m

const API_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5004/api`;

// ── Haversine ────────────────────────────────────────────────────────────────

const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Offset a lat/lng by a distance (metres) in a given bearing (degrees) ────

const offsetLatLng = (
  lat: number, lng: number, distMeters: number, bearingDeg: number,
): { lat: number; lng: number } => {
  const R = 6371e3;
  const δ = distMeters / R;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: (φ2 * 180) / Math.PI, lng: (λ2 * 180) / Math.PI };
};

// ── Map auto-recenter helper ─────────────────────────────────────────────────

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// ── Map click handler (for setting safe zone by clicking) ────────────────────

const MapClickHandler = ({
  enabled,
  onMapClick,
}: {
  enabled: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      if (enabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// ── Main component ───────────────────────────────────────────────────────────

const LocationMonitorPage = () => {
  const elderlyUserId = DEFAULT_ELDERLY_USER_ID;
  const radius = SAFE_RADIUS;

  // State
  const [mounted, setMounted] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    distance: null,
    isOutsideRadius: false,
    error: null,
    lastUpdate: null,
    loading: true,
  });
  const [safeCenterLocked, setSafeCenterLocked] = useState(false);

  // Simulation mode state
  const [simRunning, setSimRunning] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simBearingRef = useRef(45); // walk direction in degrees (NE)

  // Map-click safe zone state
  const [mapClickMode, setMapClickMode] = useState(false);

  // Refs
  const safeCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getSafeZone = (): SafeZoneConfig | null => {
    if (!safeCenterRef.current) return null;
    return {
      centerLat: safeCenterRef.current.lat,
      centerLng: safeCenterRef.current.lng,
      radius,
    };
  };

  // ── Reset the backend's "home" reference for the dev store ────────────────
  // The backend stores _homeLat/_homeLng from the first ever update. When the
  // caregiver changes the safe zone center we must tell the backend to treat
  // the new center as "home" so distance is computed from there.
  const resetBackendHome = useCallback(async (lat: number, lng: number) => {
    try {
      await fetch(`${API_URL}/location/reset-home/${elderlyUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
    } catch {
      // Non-critical – fallback to client-side distance calc
    }
  }, [elderlyUserId]);

  // Fetch latest location from backend
  const fetchLocation = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/location/latest/${elderlyUserId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setLocationState((prev) => ({
            ...prev,
            loading: false,
            error: 'No location data yet — waiting for device GPS…',
          }));
          return;
        }
        throw new Error(`Server responded ${res.status}`);
      }

      const data = await res.json();

      // Friend's route returns { available: false } when no GPS data yet
      if (data.available === false) {
        setLocationState((prev) => ({
          ...prev,
          loading: false,
          error: data.message || 'No location data yet — waiting for device GPS…',
        }));
        return;
      }

      const { latitude, longitude } = data as LocationData;

      // Auto-lock safe center on first successful fetch (if not already set)
      if (!safeCenterRef.current && !safeCenterLocked) {
        safeCenterRef.current = { lat: latitude, lng: longitude };
        setSafeCenterLocked(true);
      }

      let distance: number | null = null;
      let isOutsideRadius = false;

      if (safeCenterRef.current) {
        distance = calculateDistance(
          safeCenterRef.current.lat,
          safeCenterRef.current.lng,
          latitude,
          longitude,
        );
        isOutsideRadius = distance > radius;
      }

      setLocationState({
        latitude,
        longitude,
        distance,
        isOutsideRadius,
        error: null,
        lastUpdate: new Date(),
        loading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLocationState((prev) => ({
        ...prev,
        loading: false,
        error: `Location fetch failed: ${msg}`,
      }));
    }
  }, [elderlyUserId, radius, safeCenterLocked]);

  // ── Safe zone controls ─────────────────────────────────────────────────────

  // Set safe center from current patient position
  const handleSetSafeCenter = () => {
    if (locationState.latitude != null && locationState.longitude != null) {
      safeCenterRef.current = {
        lat: locationState.latitude,
        lng: locationState.longitude,
      };
      setSafeCenterLocked(true);
      resetBackendHome(locationState.latitude, locationState.longitude);
    }
  };

  // Set safe center by clicking on the map
  const handleMapClick = (lat: number, lng: number) => {
    safeCenterRef.current = { lat, lng };
    setSafeCenterLocked(true);
    setMapClickMode(false);
    resetBackendHome(lat, lng);
  };

  // Reset safe zone
  const handleResetSafeZone = () => {
    safeCenterRef.current = null;
    setSafeCenterLocked(false);
  };

  // ── Simulation mode ────────────────────────────────────────────────────────

  const startSimulation = useCallback(async () => {
    // Need a safe zone center to simulate from
    let startLat: number;
    let startLng: number;

    if (safeCenterRef.current) {
      startLat = safeCenterRef.current.lat;
      startLng = safeCenterRef.current.lng;
    } else {
      // Use a default location (Mumbai) if nothing is set yet
      startLat = 19.076;
      startLng = 72.8777;
      safeCenterRef.current = { lat: startLat, lng: startLng };
      setSafeCenterLocked(true);
    }

    // Seed the backend with the safe zone center as starting position
    try {
      await fetch(`${API_URL}/location/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: startLat,
          longitude: startLng,
          userId: elderlyUserId,
          accuracy: 5,
        }),
      });
    } catch { /* ignore */ }

    // Reset the backend home to match the safe zone center
    await resetBackendHome(startLat, startLng);

    // Start walking simulation
    let step = 0;
    const bearing = simBearingRef.current;
    setSimRunning(true);
    setSimStep(0);

    // Clear any previous interval
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = setInterval(async () => {
      step += 1;
      setSimStep(step);

      // Calculate new position: move `step * SIM_STEP_METERS` from center
      const totalDist = step * SIM_STEP_METERS;
      const newPos = offsetLatLng(startLat, startLng, totalDist, bearing);

      try {
        await fetch(`${API_URL}/location/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: newPos.lat,
            longitude: newPos.lng,
            userId: elderlyUserId,
            accuracy: 5,
          }),
        });
      } catch {
        // ignore network errors in sim
      }
    }, SIM_STEP_INTERVAL);
  }, [elderlyUserId, resetBackendHome]);

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setSimRunning(false);
  }, []);

  // Cleanup sim on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // Client-side mount guard (Leaflet is browser-only)
  useEffect(() => { setMounted(true); }, []);

  // Polling
  useEffect(() => {
    fetchLocation();
    pollingRef.current = setInterval(fetchLocation, POLLING_INTERVAL);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchLocation]);

  const safeZone = getSafeZone();
  const isLocationReady =
    locationState.latitude != null && locationState.longitude != null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <MapPin className="text-primary" size={28} />
              Location Monitor
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time GPS tracking of elderly patient
            </p>
          </div>

          <div className="flex gap-2">
            {/* Simulation toggle */}
            {!simRunning ? (
              <button
                onClick={startSimulation}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 text-sm font-medium transition-colors"
              >
                <Play size={15} />
                Simulate Walk
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 text-sm font-medium transition-colors"
              >
                <Square size={15} />
                Stop Sim (step {simStep})
              </button>
            )}

            <button
              onClick={fetchLocation}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors"
            >
              <RotateCw size={15} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Simulation info banner */}
        {simRunning && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
          >
            <Play className="text-emerald-600 flex-shrink-0 animate-pulse" size={18} />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              <strong>Simulation active</strong> — virtual patient is walking away from safe zone ({simStep * SIM_STEP_METERS} m so far).
              Alert will trigger when distance exceeds {radius} m.
            </p>
          </motion.div>
        )}

        {/* Map-click mode banner */}
        {mapClickMode && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-blue-500/10 border border-blue-500/30"
          >
            <MousePointerClick className="text-blue-600 flex-shrink-0 animate-bounce" size={18} />
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Click anywhere on the map</strong> to set the safe zone center.
            </p>
            <button
              onClick={() => setMapClickMode(false)}
              className="ml-auto text-xs px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {/* Status cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {/* Distance */}
          <MBCard elevated>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${locationState.isOutsideRadius ? 'bg-destructive/10' : 'bg-success/10'}`}>
                <Navigation
                  size={22}
                  className={locationState.isOutsideRadius ? 'text-destructive' : 'text-success'}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="text-lg font-semibold text-foreground">
                  {locationState.distance != null
                    ? `${locationState.distance.toFixed(1)} m`
                    : '—'}
                </p>
              </div>
            </div>
          </MBCard>

          {/* Status */}
          <MBCard elevated>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${locationState.isOutsideRadius ? 'bg-destructive/10' : 'bg-success/10'}`}>
                {locationState.isOutsideRadius ? (
                  <AlertTriangle size={22} className="text-destructive" />
                ) : (
                  <Shield size={22} className="text-success" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`text-lg font-semibold ${locationState.isOutsideRadius ? 'text-destructive' : 'text-success'}`}>
                  {locationState.isOutsideRadius ? 'Outside Zone' : 'Inside Zone'}
                </p>
              </div>
            </div>
          </MBCard>

          {/* Last update */}
          <MBCard elevated>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Clock size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="text-sm font-medium text-foreground">
                  {locationState.lastUpdate
                    ? locationState.lastUpdate.toLocaleTimeString()
                    : '—'}
                </p>
              </div>
            </div>
          </MBCard>
        </div>

        {/* Safe zone controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {safeCenterLocked ? (
            <button
              onClick={handleResetSafeZone}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/15 text-warning hover:bg-warning/25 text-sm font-medium transition-colors"
            >
              <Unlock size={15} />
              Reset Safe Zone
            </button>
          ) : (
            <>
              <button
                onClick={handleSetSafeCenter}
                disabled={!isLocationReady}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Lock size={15} />
                Set Current as Safe Zone
              </button>
              <button
                onClick={() => setMapClickMode(!mapClickMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mapClickMode
                    ? 'bg-blue-500/25 text-blue-600 ring-2 ring-blue-500/40'
                    : 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/25'
                }`}
              >
                <MousePointerClick size={15} />
                {mapClickMode ? 'Click Map Now…' : 'Place on Map'}
              </button>
            </>
          )}
          <span className="text-xs text-muted-foreground">
            Radius: <strong>{radius} m</strong>
            {safeCenterLocked && safeZone && (
              <> · Center: {safeZone.centerLat.toFixed(5)}, {safeZone.centerLng.toFixed(5)}</>
            )}
          </span>
        </div>

        {/* Outside-zone banner */}
        {locationState.isOutsideRadius && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-destructive/10 border border-destructive/30"
          >
            <AlertTriangle className="text-destructive flex-shrink-0" size={22} />
            <div>
              <p className="font-semibold text-destructive">Patient is outside the safe zone!</p>
              <p className="text-sm text-muted-foreground">
                Distance from safe center: {locationState.distance?.toFixed(1)} m (limit: {radius} m)
              </p>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {locationState.error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-warning/10 border border-warning/30">
            <AlertTriangle className="text-warning flex-shrink-0" size={20} />
            <p className="text-sm text-warning">{locationState.error}</p>
          </div>
        )}

        {/* Map */}
        <MBCard elevated className="overflow-hidden rounded-xl">
          {!mounted || locationState.loading ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground gap-3">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm">Loading map…</p>
            </div>
          ) : !isLocationReady ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground gap-3">
              <MapPin size={36} className="text-muted-foreground/50" />
              <p className="text-sm">Waiting for GPS data…</p>
            </div>
          ) : (
            <MapContainer
              center={[locationState.latitude!, locationState.longitude!]}
              zoom={DEFAULT_MAP_ZOOM}
              style={{ height: '500px', width: '100%' }}
              scrollWheelZoom
              className={mapClickMode ? 'cursor-crosshair' : ''}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={[locationState.latitude!, locationState.longitude!]} />
              <MapClickHandler enabled={mapClickMode} onMapClick={handleMapClick} />

              {/* Patient marker */}
              <Marker position={[locationState.latitude!, locationState.longitude!]}>
                <Popup>
                  <strong>Patient Location</strong>
                  <br />
                  {locationState.latitude!.toFixed(6)}, {locationState.longitude!.toFixed(6)}
                  {locationState.lastUpdate && (
                    <>
                      <br />
                      <em style={{ fontSize: '0.8em' }}>
                        {locationState.lastUpdate.toLocaleTimeString()}
                      </em>
                    </>
                  )}
                </Popup>
              </Marker>

              {/* Safe zone circle */}
              {safeZone && (
                <>
                  <Circle
                    center={[safeZone.centerLat, safeZone.centerLng]}
                    radius={safeZone.radius}
                    pathOptions={{
                      color: locationState.isOutsideRadius ? '#ef4444' : '#22c55e',
                      fillColor: locationState.isOutsideRadius ? '#ef4444' : '#22c55e',
                      fillOpacity: 0.15,
                      weight: 2,
                    }}
                  />
                  <Marker position={[safeZone.centerLat, safeZone.centerLng]}>
                    <Popup>
                      <strong>Safe Zone Center</strong>
                      <br />
                      Radius: {safeZone.radius} m
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          )}
        </MBCard>

        {/* Coordinates footer */}
        {isLocationReady && (
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle size={12} className="text-success" />
              Lat: {locationState.latitude!.toFixed(6)}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle size={12} className="text-success" />
              Lng: {locationState.longitude!.toFixed(6)}
            </span>
            <span>Polling every {POLLING_INTERVAL / 1000}s</span>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default LocationMonitorPage;
