import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  LatLng,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  UrlTile,
} from "react-native-maps";
import simplify from "simplify-js";
import { encodePolyline } from "../../utils/polyline";
import { CreateSystemActivity } from "../../api/user/user";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// GPS Config 
const GPS = {
  MIN_ACCURACY:  25,    
  MAX_SPEED:     10,    
  MIN_DISTANCE:   2,    
  MAX_JUMP:      40,    
  INTERVAL:    1000,  
  KALMAN_Q:       3,    
  KALMAN_R:       8,    
  SPEED_EMA:    0.3,    
};

//  Polyline Config 
const POLYLINE = {
  MAX_STORED:         5000,   
  TRIM_TO:            4000,   
  MAX_LIVE_POINTS:     200,   
  TOLERANCE_RUNNING: 0.00009, 
  TOLERANCE_FINISHED:0.00005,
};

interface LocationPoint extends LatLng {
  timestamp: number;
  accuracy?: number;
  altitude?: number;
}

interface KalmanState {
  lat: number;
  lng: number;
  variance: number;
}

interface Split {
  km: number;
  pace: string;
  timestamp: number;
}

type PickerMode = "start" | "finish";

interface PlaceSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}


interface Metrics {
  distance:       number;
  duration:       number;
  speed:          number;
  elevGain:       number;
  elevLow:        number | null;
  elevHigh:       number | null;
  gpsAccuracy:    number | null;
  splits:         Split[];
  lastSplitDist:  number;
  last:           LocationPoint | null;
  kalman:         KalmanState | null;
  locations:      LocationPoint[];
  lastFlushedLen: number;
}

interface Display {
  distance:    number;
  duration:    number;
  speed:       number;
  elevGain:    number;
  elevLow:     number | null;
  elevHigh:    number | null;
  gpsAccuracy: number | null;
  locations:   LocationPoint[];
  current:     LocationPoint | null;
}

const EMPTY_METRICS = (): Metrics => ({
  distance: 0, duration: 0, speed: 0,
  elevGain: 0, elevLow: null, elevHigh: null,
  gpsAccuracy: null, splits: [], lastSplitDist: 0,
  last: null, kalman: null, locations: [], lastFlushedLen: 0,
});

const EMPTY_DISPLAY: Display = {
  distance: 0, duration: 0, speed: 0,
  elevGain: 0, elevLow: null, elevHigh: null,
  gpsAccuracy: null, locations: [], current: null,
};


function haversine(a: LocationPoint, b: LocationPoint): number {
  const R   = 6_371_000;
  const toR = (d: number) => d * (Math.PI / 180);
  const dLat = toR(b.latitude  - a.latitude);
  const dLon = toR(b.longitude - a.longitude);
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a.latitude)) * Math.cos(toR(b.latitude)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

//Kalman filter — 

function applyKalman(
  M: React.MutableRefObject<Metrics>,
  lat: number,
  lng: number,
  acc: number,
): { lat: number; lng: number } {
  const m = M.current;
  if (!m.kalman) {
    m.kalman = { lat, lng, variance: acc * acc };
    return { lat, lng };
  }
  const predVar = m.kalman.variance + GPS.KALMAN_Q;
  const gain    = predVar / (predVar + GPS.KALMAN_R);
  const nLat    = m.kalman.lat + gain * (lat - m.kalman.lat);
  const nLng    = m.kalman.lng + gain * (lng - m.kalman.lng);
  m.kalman      = { lat: nLat, lng: nLng, variance: (1 - gain) * predVar };
  return { lat: nLat, lng: nLng };
}

// simplify-js (Ramer–Douglas–Peucker)
function simplifyLocations(
  locs: LocationPoint[],
  tolerance: number,
): LocationPoint[] {
  if (locs.length < 3) return locs;

  const pts = locs.map((l) => ({ x: l.longitude, y: l.latitude }));
  const simplified = simplify(pts, tolerance, true); // highQuality = true

  // Tìm lại điểm gốc để giữ timestamp, altitude, accuracy
  return simplified.map((pt) => {
    const found = locs.find(
      (l) =>
        Math.abs(l.longitude - pt.x) < 0.000001 &&
        Math.abs(l.latitude  - pt.y) < 0.000001,
    );
    return found ?? {
      latitude:  pt.y,
      longitude: pt.x,
      timestamp: 0,
    };
  });
}

// Format helpers
function formatTime(s: number): string {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

function formatPace(distM: number, durSec: number): string {
  if (distM < 50) return "--:--";
  const dec = durSec / 60 / (distM / 1000);
  if (dec > 60 || dec <= 0) return "--:--";
  const m  = Math.floor(dec);
  let   sc = Math.round((dec - m) * 60);
  let   dm = m;
  if (sc === 60) { sc = 0; dm += 1; }
  return `${dm}'${String(sc).padStart(2, "0")}"`;
}

function distDisplay(distM: number): { value: string; unit: string } {
  return distM >= 1000
    ? { value: (distM / 1000).toFixed(2), unit: "km" }
    : { value: String(Math.round(distM)),  unit: "m"  };
}

function gpsColor(acc: number | null): string {
  if (!acc)      return "#9CA3AF";
  if (acc <= 5)  return "#10B981";
  if (acc <= 10) return "#84CC16";
  if (acc <= 20) return "#F59E0B";
  return "#EF4444";
}

function gpsLabel(acc: number | null): string {
  if (!acc)      return "Đang tìm GPS...";
  if (acc <= 5)  return "GPS tuyệt vời";
  if (acc <= 10) return "GPS tốt";
  if (acc <= 20) return "GPS trung bình";
  return "GPS yếu";
}

function shortAddress(address: string): string {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.slice(0, 3).join(", ");
}

async function searchVietnamesePlaces(query: string): Promise<PlaceSearchResult[]> {
  const keyword = query.trim();

  if (keyword.length < 2) return [];

  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=json&limit=6&countrycodes=vn&accept-language=vi&q=${encodeURIComponent(keyword)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "URaceApp/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Không thể tìm địa điểm. Vui lòng thử lại.");
  }

  return response.json();
}

function createPickedLocationName(mode: PickerMode, point: LatLng): string {
  const label = mode === "start" ? "Điểm bắt đầu" : "Điểm kết thúc";
  return `${label} (${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)})`;
}

// ─────────────tui là đường phân cách siêu dễ thương :33──────────────────────
export default function RunTracker({ onBack }: { onBack?: () => void }) {

  const [isRunning,  setIsRunning]  = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);

  const [display, setDisplay] = useState<Display>(EMPTY_DISPLAY);

  const [pickerMode, setPickerMode] = useState<PickerMode>("start");
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [finishPoint, setFinishPoint] = useState<LatLng | null>(null);
  const [startText, setStartText] = useState("");
  const [finishText, setFinishText] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);

  const M         = useRef<Metrics>(EMPTY_METRICS());
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const subRef    = useRef<Location.LocationSubscription | null>(null);
  const mapRef    = useRef<MapView | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Unmount cleanup
  useEffect(() => () => { _stopTimer(); _stopSub(); }, []);

  // Pulse animation
  useEffect(() => {
    if (isRunning && !isPaused) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 750, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 750, useNativeDriver: true }),
        ]),
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [isRunning, isPaused]);

  // ══════════════════════ INFRASTRUCTURE ═══════════════════

  const _stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const _stopSub = () => {
    if (subRef.current) { subRef.current.remove(); subRef.current = null; }
  };


  const _startTimer = () => {
    _stopTimer();
    timerRef.current = setInterval(() => {
      const m = M.current;
      m.duration += 1;

      const locGrew = m.locations.length !== m.lastFlushedLen;
      const locSnap = locGrew ? [...m.locations] : undefined;
      if (locGrew) m.lastFlushedLen = m.locations.length;

      setDisplay((prev) => ({
        distance:    m.distance,
        duration:    m.duration,
        speed:       m.speed,
        elevGain:    m.elevGain,
        elevLow:     m.elevLow,
        elevHigh:    m.elevHigh,
        gpsAccuracy: m.gpsAccuracy,
        locations:   locSnap ?? prev.locations,
        current:     m.last,
      }));
    }, 1000);
  };

  //LOCATION HANDLER

  const onLocation = useCallback(
    (loc: Location.LocationObject) => {
      const { latitude, longitude, accuracy, altitude } = loc.coords;
      const time = loc.timestamp;
      const m    = M.current;

      m.gpsAccuracy = accuracy ?? null;

      // Accuracy gate
      if (accuracy && accuracy > GPS.MIN_ACCURACY) return;

      // Elevation extremes (raw GPS)
      if (altitude != null) {
        m.elevLow  = m.elevLow  == null ? altitude : Math.min(m.elevLow,  altitude);
        m.elevHigh = m.elevHigh == null ? altitude : Math.max(m.elevHigh, altitude);
      }

      // Kalman smooth — gọi module-level function, truyền M ref vào
      const pos = applyKalman(M, latitude, longitude, accuracy ?? 15);
      const pt: LocationPoint = {
        latitude:  pos.lat,
        longitude: pos.lng,
        timestamp: time,
        accuracy:  accuracy ?? undefined,
        altitude:  altitude ?? undefined,
      };

      // First valid point
      if (!m.last) {
        m.last = pt;
        m.locations.push(pt);
        return;
      }

      const prev = m.last;
      const d    = haversine(prev, pt);
      const dt   = (time - prev.timestamp) / 1000;

      // Spike / noise / speed gates
      if (d > GPS.MAX_JUMP)                  return;
      if (dt > 0 && d / dt > GPS.MAX_SPEED) return;
      if (d < GPS.MIN_DISTANCE)             return;

      // EMA-smoothed speed (Haversine-derived, không dùng GPS speed field)
      if (dt > 0) {
        const raw = (d / dt) * 3.6;
        m.speed   = m.speed * (1 - GPS.SPEED_EMA) + raw * GPS.SPEED_EMA;
      }

      // Elevation gain — lọc noise nhỏ hơn 1m
      if (pt.altitude != null && prev.altitude != null) {
        const diff = pt.altitude - prev.altitude;
        if (diff > 1.0) m.elevGain += diff;
      }

      // Distance + split detection
      const newDist = m.distance + d;
      const prevKm  = Math.floor(m.lastSplitDist / 1000);
      const newKm   = Math.floor(newDist / 1000);
      if (newKm > prevKm) {
        m.splits.push({
          km:        newKm,
          pace:      formatPace(newDist, m.duration),
          timestamp: Date.now(),
        });
      }

      m.distance      = newDist;
      m.lastSplitDist = newDist;
      m.last          = pt;
      m.locations.push(pt);

      // thêm giới hạn
      if (m.locations.length > POLYLINE.MAX_STORED) {
        m.locations = m.locations.slice(-POLYLINE.TRIM_TO);
        m.lastFlushedLen = Math.min(m.lastFlushedLen, m.locations.length);
      }

      // sửa lỗi React re-render
      mapRef.current?.animateToRegion(
        {
          latitude:       pt.latitude,
          longitude:      pt.longitude,
          latitudeDelta:  0.003,
          longitudeDelta: 0.003,
        },
        300,
      );
    },
    [M],
  );

  const _startSub = async () => {
    _stopSub();
    subRef.current = await Location.watchPositionAsync(
      {
        accuracy:         Location.Accuracy.BestForNavigation,
        timeInterval:     GPS.INTERVAL,
        distanceInterval: 0,
      },
      onLocation,
    );
  };

  const activeSearchText = pickerMode === "start" ? startText : finishText;

  const handleSearchPlace = async () => {
    try {
      setIsSearchingPlace(true);
      const results = await searchVietnamesePlaces(activeSearchText);
      setSearchResults(results);

      if (results.length === 0) {
        Alert.alert("Không tìm thấy", "Bạn thử nhập tên địa điểm đầy đủ hơn, ví dụ: Hồ Gươm, Hà Nội.");
      }
    } catch (error: any) {
      Alert.alert("Lỗi tìm kiếm", error?.message ?? "Không thể tìm địa điểm.");
    } finally {
      setIsSearchingPlace(false);
    }
  };

  const applyPickedPoint = (mode: PickerMode, point: LatLng, label?: string) => {
    if (mode === "start") {
      setStartPoint(point);
      setStartText(label ?? createPickedLocationName(mode, point));
    } else {
      setFinishPoint(point);
      setFinishText(label ?? createPickedLocationName(mode, point));
    }

    setSearchResults([]);

    mapRef.current?.animateToRegion(
      {
        latitude: point.latitude,
        longitude: point.longitude,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      },
      300,
    );
  };

  const handleSelectSearchResult = (place: PlaceSearchResult) => {
    const point = {
      latitude: Number(place.lat),
      longitude: Number(place.lon),
    };

    applyPickedPoint(pickerMode, point, shortAddress(place.display_name));
  };

  const handleMapLongPress = (event: any) => {
    if (isRunning) return;

    const point = event.nativeEvent.coordinate as LatLng;
    applyPickedPoint(pickerMode, point);
  };

  const clearPlannedRoute = () => {
    setStartPoint(null);
    setFinishPoint(null);
    setStartText("");
    setFinishText("");
    setSearchResults([]);
    setPickerMode("start");
  };

  // ...

  const startRun = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền vị trí",
        "Vui lòng cấp quyền truy cập vị trí để bắt đầu chạy.",
      );
      return;
    }
    M.current = EMPTY_METRICS();
    setDisplay(EMPTY_DISPLAY);
    setIsRunning(true);
    setIsFinished(false);
    setIsPaused(false);
    await _startSub();
    _startTimer();
  };

  const pauseRun = () => {
    setIsPaused(true);
    _stopTimer();
    _stopSub();
  };

  const resumeRun = async () => {
    M.current.last   = null;
    M.current.kalman = null;
    setIsPaused(false);
    await _startSub();
    _startTimer();
  };

  const stopRun = () => {
    _stopTimer();
    _stopSub();
    setIsRunning(false);
    setIsFinished(true);
    setIsPaused(false);

    const m = M.current;

    setDisplay((prev) => ({
      ...prev,
      distance:  m.distance,
      duration:  m.duration,
      speed:     m.speed,
      elevGain:  m.elevGain,
      elevLow:   m.elevLow,
      elevHigh:  m.elevHigh,
      locations: [...m.locations],
      current:   m.last,
    }));

    if (mapRef.current && m.locations.length > 1) {
      // Dùng locations gốc (chưa simplify) để fit map chính xác hơn
      mapRef.current.fitToCoordinates(m.locations, {
        edgePadding: { top: 100, right: 50, bottom: 320, left: 50 },
        animated: true,
      });
    }
  };

  const resetRun = () => {
    M.current = EMPTY_METRICS();
    setDisplay(EMPTY_DISPLAY);
    setIsFinished(false);
  };

  const handleSave = async () => {
    const m = M.current;
    if (m.distance < 10) {
      Alert.alert("Thông báo", "Không có dữ liệu để lưu.");
      return;
    }
    try {
      // Encode polyline 
      const polyline = encodePolyline(
        m.locations.map((l) => ({ latitude: l.latitude, longitude: l.longitude })),
      );
      await CreateSystemActivity({
  name: `Chạy bộ ${new Date().toLocaleDateString("vi-VN")}`,
  distance: m.distance / 1000,
  movingTime: m.duration,
  elapsedTime: m.duration,
  startDate: new Date().toISOString(),
  workoutType: "Run",
  mapPolyline: polyline,

  routePoints: m.locations.map((l) => ({
    latitude: l.latitude,
    longitude: l.longitude,
    timestamp: l.timestamp,
    accuracy: l.accuracy,
  })),

  totalElevationGain: m.elevGain,
  elevLow: m.elevLow,
  elevHigh: m.elevHigh,
  splitsMetric: m.splits,

  plannedStartLocation: startPoint
    ? {
        latitude: startPoint.latitude,
        longitude: startPoint.longitude,
        name: startText,
      }
    : undefined,

  plannedFinishLocation: finishPoint
    ? {
        latitude: finishPoint.latitude,
        longitude: finishPoint.longitude,
        name: finishText,
      }
    : undefined,
});
      Alert.alert("Thành công", "Đã lưu hoạt động!", [
        { text: "OK", onPress: resetRun },
      ]);
    } catch (e: any) {
      Alert.alert("Lỗi", "Không thể lưu. " + (e?.message ?? "Vui lòng thử lại."));
    }
  };

  // lamf nho diem ahihi
  const polylineCoords = (() => {
    const locs = display.locations;
    if (locs.length < 2) return locs;

    if (isFinished) {
      return simplifyLocations(locs, POLYLINE.TOLERANCE_FINISHED);
    }

    const recentLocs =
      locs.length > POLYLINE.MAX_LIVE_POINTS
        ? locs.slice(-POLYLINE.MAX_LIVE_POINTS)
        : locs;

    return simplifyLocations(recentLocs, POLYLINE.TOLERANCE_RUNNING);
  })();

  // render

  const dist = distDisplay(display.distance);
  const pace = formatPace(display.distance, display.duration);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* MAP */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={s.map}
        userInterfaceStyle="light"
        initialRegion={{
          latitude:       21.0285,
          longitude:      105.8542,
          latitudeDelta:  0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={!isRunning}
        showsMyLocationButton={false}
        showsCompass={false}
        mapType={Platform.OS === "android" ? "none" : "standard"}
        onLongPress={handleMapLongPress}
      >
        {Platform.OS === "android" && (
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
        )}
        {/* Route polyline — dùng polylineCoords đã simplify */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#4F46E5"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Planned route */}
        {startPoint && finishPoint && !isRunning && (
          <Polyline
            coordinates={[startPoint, finishPoint]}
            strokeColor="#0EA5E9"
            strokeWidth={4}
            lineDashPattern={[8, 6]}
            lineCap="round"
          />
        )}

        {startPoint && !isRunning && (
          <Marker coordinate={startPoint}>
            <View style={s.markerPlannedStart}>
              <Ionicons name="location" size={16} color="#fff" />
            </View>
          </Marker>
        )}

        {finishPoint && !isRunning && (
          <Marker coordinate={finishPoint}>
            <View style={s.markerPlannedFinish}>
              <Ionicons name="flag" size={16} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Start marker */}
        {display.locations.length > 0 && (
          <Marker coordinate={display.locations[0]}>
            <View style={s.markerStart}>
              <Ionicons name="flag" size={16} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Current position marker */}
        {display.current && isRunning && (
          <Marker coordinate={display.current}>
            <View style={s.markerCurrent}>
              <View style={s.markerDot} />
            </View>
          </Marker>
        )}

        {/* Finish marker */}
        {isFinished && display.locations.length > 0 && (
          <Marker coordinate={display.locations[display.locations.length - 1]}>
            <View style={s.markerFinish}>
              <Ionicons name="trophy" size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* PLACE SEARCH / ROUTE PICKER */}
      {!isRunning && !isFinished && (
        <View style={s.searchBox}>
          <View style={s.pickTabs}>
            <TouchableOpacity
              style={[s.pickTab, pickerMode === "start" && s.pickTabActive]}
              onPress={() => {
                setPickerMode("start");
                setSearchResults([]);
              }}
            >
              <Text style={[s.pickTabText, pickerMode === "start" && s.pickTabTextActive]}>
                Bắt đầu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.pickTab, pickerMode === "finish" && s.pickTabActive]}
              onPress={() => {
                setPickerMode("finish");
                setSearchResults([]);
              }}
            >
              <Text style={[s.pickTabText, pickerMode === "finish" && s.pickTabTextActive]}>
                Kết thúc
              </Text>
            </TouchableOpacity>
          </View>

          <View style={s.searchRow}>
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              value={pickerMode === "start" ? startText : finishText}
              onChangeText={(text) => {
                if (pickerMode === "start") setStartText(text);
                else setFinishText(text);
              }}
              placeholder={
                pickerMode === "start"
                  ? "Nhập hoặc giữ trên bản đồ để chọn điểm bắt đầu"
                  : "Nhập hoặc giữ trên bản đồ để chọn điểm kết thúc"
              }
              placeholderTextColor="#9CA3AF"
              style={s.searchInput}
              returnKeyType="search"
              onSubmitEditing={handleSearchPlace}
            />
            <TouchableOpacity style={s.searchBtn} onPress={handleSearchPlace}>
              <Text style={s.searchBtnText}>{isSearchingPlace ? "..." : "Tìm"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.mapHint}>
            Gõ tên địa điểm tiếng Việt hoặc giữ trên bản đồ để chọn điểm.
          </Text>

          {searchResults.length > 0 && (
            <View style={s.resultList}>
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={String(item.place_id)}
                  style={s.resultItem}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <Ionicons name="location-outline" size={16} color="#4F46E5" />
                  <Text style={s.resultText} numberOfLines={2}>
                    {shortAddress(item.display_name)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {(startPoint || finishPoint) && (
            <TouchableOpacity style={s.clearRouteBtn} onPress={clearPlannedRoute}>
              <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
              <Text style={s.clearRouteText}>Xóa điểm đã chọn</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* BACK BUTTON */}
      <TouchableOpacity style={s.back} onPress={onBack} activeOpacity={0.8}>
        <View style={s.backInner}>
          <Ionicons name="arrow-back" size={22} color="#4F46E5" />
        </View>
      </TouchableOpacity>

      {/* GPS BADGE — right side (không đè nút Back) */}
      {(isRunning || isPaused) && (
        <View style={s.gpsBadge}>
          <View style={[s.gpsDot, { backgroundColor: gpsColor(display.gpsAccuracy) }]} />
          <Text style={s.gpsLabelTxt}>{gpsLabel(display.gpsAccuracy)}</Text>
          {display.gpsAccuracy != null && (
            <Text style={s.gpsValue}>±{display.gpsAccuracy.toFixed(0)}m</Text>
          )}
        </View>
      )}

      {/* RECORDING BADGE */}
      {isRunning && !isPaused && (
        <View style={s.recBadge}>
          <Animated.View style={[s.recDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={s.recTxt}>ĐANG GHI</Text>
        </View>
      )}

      {/* PAUSED BADGE */}
      {isPaused && (
        <View style={[s.recBadge, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
          <Ionicons name="pause-circle" size={12} color="#F59E0B" style={{ marginRight: 6 }} />
          <Text style={[s.recTxt, { color: "#F59E0B" }]}>TẠM DỪNG</Text>
        </View>
      )}

      {/* STATS PANEL */}
      <View style={[s.panel, isFinished && s.panelTall]}>
        <View style={s.handle} />

        {/* Time */}
        <View style={s.timeRow}>
          <Text style={s.timeLbl}>TIME</Text>
          <Text style={s.timeVal}>{formatTime(display.duration)}</Text>
        </View>

        {/* 4-col grid */}
        <View style={s.grid}>
          <View style={s.cell}>
            <View style={s.cellIcon}>
              <Ionicons name="navigate" size={20} color="#4F46E5" />
            </View>
            <Text style={s.cellVal}>
              {dist.value}
              <Text style={s.cellUnit}> {dist.unit}</Text>
            </Text>
            <Text style={s.cellLbl}>Distance</Text>
          </View>

          <View style={s.cell}>
            <View style={s.cellIcon}>
              <Ionicons name="speedometer" size={20} color="#4F46E5" />
            </View>
            <Text style={s.cellVal}>
              {pace}
              <Text style={s.cellUnit}> /km</Text>
            </Text>
            <Text style={s.cellLbl}>Pace</Text>
          </View>

          <View style={s.cell}>
            <View style={s.cellIcon}>
              <Ionicons name="flash" size={20} color="#4F46E5" />
            </View>
            <Text style={s.cellVal}>
              {display.speed.toFixed(1)}
              <Text style={s.cellUnit}> km/h</Text>
            </Text>
            <Text style={s.cellLbl}>Speed</Text>
          </View>

          <View style={s.cell}>
            <View style={s.cellIcon}>
              <Ionicons name="trending-up" size={20} color="#4F46E5" />
            </View>
            <Text style={s.cellVal}>
              {Math.round(display.elevGain)}
              <Text style={s.cellUnit}> m</Text>
            </Text>
            <Text style={s.cellLbl}>Elevation</Text>
          </View>
        </View>

        {/* Elevation Low / High — chỉ hiện khi finished */}
        {isFinished && (display.elevLow != null || display.elevHigh != null) && (
          <View style={s.elevRow}>
            {display.elevLow != null && (
              <View style={s.elevItem}>
                <Ionicons name="arrow-down-circle-outline" size={14} color="#6B7280" />
                <Text style={s.elevVal}>{Math.round(display.elevLow)}m</Text>
                <Text style={s.elevLbl}>Thấp nhất</Text>
              </View>
            )}
            {display.elevHigh != null && (
              <View style={s.elevItem}>
                <Ionicons name="arrow-up-circle-outline" size={14} color="#6B7280" />
                <Text style={s.elevVal}>{Math.round(display.elevHigh)}m</Text>
                <Text style={s.elevLbl}>Cao nhất</Text>
              </View>
            )}
          </View>
        )}

        {/* Buttons */}
        <View style={s.btnRow}>
          {/* Idle */}
          {!isRunning && !isFinished && (
            <TouchableOpacity style={s.btnStart} onPress={startRun}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.gradient}
              >
                <Ionicons name="play" size={28} color="#fff" />
                <Text style={s.btnTxt}>START</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Running */}
          {isRunning && !isPaused && (
            <View style={s.dualBtn}>
              <TouchableOpacity style={[s.circle, s.cPause]} onPress={pauseRun}>
                <Ionicons name="pause" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[s.circle, s.cStop]} onPress={stopRun}>
                <Ionicons name="stop" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Paused */}
          {isPaused && (
            <View style={s.dualBtn}>
              <TouchableOpacity style={[s.circle, s.cResume]} onPress={resumeRun}>
                <Ionicons name="play" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[s.circle, s.cStop]} onPress={stopRun}>
                <Ionicons name="stop" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Finished */}
          {isFinished && (
            <View style={s.finRow}>
              <TouchableOpacity style={s.btnSave} onPress={handleSave}>
                <LinearGradient
                  colors={["#4F46E5", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.gradient}
                >
                  <Ionicons name="save" size={24} color="#fff" />
                  <Text style={s.btnTxt}>LƯU</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnDiscard} onPress={resetRun}>
                <Ionicons name="trash" size={24} color="#EF4444" />
                <Text style={s.discardTxt}>HỦY</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

//  giao dien
const TOP = Platform.OS === "android" ? 50 : 60;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  map:       { ...StyleSheet.absoluteFillObject },

  markerStart: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#10B981",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  markerCurrent: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(79,70,229,0.25)",
    justifyContent: "center", alignItems: "center",
  },
  markerDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#4F46E5",
    borderWidth: 2, borderColor: "#fff",
  },
  markerFinish: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F59E0B",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  markerPlannedStart: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#0EA5E9",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22, shadowRadius: 4, elevation: 5,
  },
  markerPlannedFinish: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#EC4899",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22, shadowRadius: 4, elevation: 5,
  },

  searchBox: {
    position: "absolute",
    top: TOP + 54,
    left: 16,
    right: 16,
    zIndex: 90,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  pickTabs: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    padding: 3,
    borderRadius: 12,
    marginBottom: 10,
  },
  pickTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  pickTabActive: {
    backgroundColor: "#4F46E5",
  },
  pickTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  pickTabTextActive: {
    color: "#fff",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 10,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "android" ? 6 : 10,
  },
  searchBtn: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  searchBtnText: {
    color: "#4F46E5",
    fontWeight: "800",
    fontSize: 12,
  },
  mapHint: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 8,
  },
  resultList: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  resultText: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  clearRouteBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
  },
  clearRouteText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },

  back:      { position: "absolute", top: TOP, left: 16, zIndex: 100 },
  backInner: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
  },

  gpsBadge: {
    position: "absolute", top: TOP, right: 16,
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  gpsDot:      { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  gpsLabelTxt: { fontSize: 12, fontWeight: "600", color: "#374151" },
  gpsValue:    { fontSize: 11, color: "#6B7280", marginLeft: 6 },

  recBadge: {
    position: "absolute", top: TOP + 48, right: 16,
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  recDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: "#EF4444", marginRight: 6,
  },
  recTxt: { fontSize: 12, fontWeight: "700", color: "#EF4444" },

  panel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12, paddingHorizontal: 20,
    paddingBottom: Platform.OS === "android" ? 140 : 150,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
    minHeight: SCREEN_HEIGHT * 0.38,
  },
  panelTall: { minHeight: SCREEN_HEIGHT * 0.50 },
  handle:    {
    width: 40, height: 4, backgroundColor: "#E5E7EB",
    borderRadius: 2, alignSelf: "center", marginBottom: 16,
  },

  timeRow: { alignItems: "center", marginBottom: 18 },
  timeLbl: { fontSize: 11, fontWeight: "600", color: "#9CA3AF", letterSpacing: 2, marginBottom: 2 },
  timeVal: { fontSize: 54, fontWeight: "700", color: "#111827", fontVariant: ["tabular-nums"] },

  grid:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  cell:     { flex: 1, alignItems: "center", paddingHorizontal: 6 },
  cellIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center", alignItems: "center", marginBottom: 6,
  },
  cellVal:  { fontSize: 19, fontWeight: "700", color: "#111827", fontVariant: ["tabular-nums"] },
  cellUnit: { fontSize: 11, fontWeight: "500", color: "#6B7280" },
  cellLbl:  { fontSize: 11, fontWeight: "500", color: "#9CA3AF", marginTop: 2 },

  // Elevation low/high row (chỉ hiện khi finished)
  elevRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginBottom: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  elevItem: { alignItems: "center", gap: 2 },
  elevVal:  { fontSize: 14, fontWeight: "700", color: "#111827" },
  elevLbl:  { fontSize: 11, color: "#9CA3AF" },

  btnRow:     { marginTop: "auto" },
  btnStart:   {
    borderRadius: 16, overflow: "hidden",
    shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnSave:    {
    flex: 1, borderRadius: 16, overflow: "hidden",
    shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  gradient:   {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, paddingHorizontal: 32, gap: 10,
  },
  btnTxt:     { fontSize: 18, fontWeight: "700", color: "#fff", letterSpacing: 2 },
  dualBtn:    { flexDirection: "row", justifyContent: "center", gap: 20 },
  circle:     {
    width: 66, height: 66, borderRadius: 33,
    justifyContent: "center", alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  cPause:     { backgroundColor: "#F59E0B", shadowColor: "#F59E0B" },
  cResume:    { backgroundColor: "#10B981", shadowColor: "#10B981" },
  cStop:      { backgroundColor: "#EF4444", shadowColor: "#EF4444" },
  finRow:     { flexDirection: "row", gap: 12 },
  btnDiscard: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, paddingHorizontal: 24,
    borderRadius: 16, backgroundColor: "#FEE2E2", gap: 8,
  },
  discardTxt: { fontSize: 16, fontWeight: "700", color: "#EF4444" },
});