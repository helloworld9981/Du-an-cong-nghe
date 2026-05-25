import { CreateContest, UpdateContest } from "@/api/contest/contest";
import { contestActivityType, contestType } from "@/constants/contest";
import { useContestStore } from "@/zustand/contestStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { toast } from "sonner-native";
import MapView, { Polyline, Marker } from "react-native-maps";

export default function CreateContestBottomSheet({
  onClose,
  visible,
  groupId,
  isEditing = false,
  selectedContest,
}: {
  onClose: () => void;
  visible: boolean;
  groupId?: string;
  isEditing?: boolean;
  selectedContest?: any;
}) {
  const isAndroid = Platform.OS === "android";
  const { width, height } = Dimensions.get("window");
  // FIX 1: Giữ nguyên chiều cao 85% không để full màn
  const SHEET_HEIGHT = height * 0.85;

  const [descriptionHeight, setDescriptionHeight] = useState<number>(0);
  const minDescHeight = isAndroid ? 80 : 100;
  const maxDescHeight = isAndroid ? 140 : 180;

  const computedDescHeight = useMemo(() => {
    if (!descriptionHeight) return minDescHeight;
    return Math.min(Math.max(descriptionHeight, minDescHeight), maxDescHeight);
  }, [descriptionHeight]);

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosingByDrag = useRef(false);
  const DRAG_THRESHOLD = SHEET_HEIGHT * 0.25;
  type Coord = {
  latitude: number;
  longitude: number;
};

  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  //lần 10080
  const [startPoint, setStartPoint] = useState<{
  address: string;
  coords: Coord | null;
}>({
  address: "",
  coords: null,
});

const [endPoint, setEndPoint] = useState<{
  address: string;
  coords: Coord | null;
}>({
  address: "",
  coords: null,
});

  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [routePoints, setRoutePoints] = useState<any[]>([]);
const [routeDistance, setRouteDistance] = useState<number>(0);
const [loadingRoute, setLoadingRoute] = useState(false);

  const [formData, setFormData] = useState({
    name: isEditing ? selectedContest.name : "",
    description: isEditing ? selectedContest.description : "",
    startAt: isEditing ? new Date(selectedContest.startAt) : new Date(),
    endAt: isEditing ? new Date(selectedContest.endAt) : new Date(),
    contestType: isEditing ? selectedContest.contestType : "",
    activityType: isEditing ? selectedContest.activityType : "",
    minPace: isEditing ? selectedContest.minPace : "",
    maxPace: isEditing ? selectedContest.maxPace : "",
    minDistance: isEditing ? selectedContest.minDistance : "",
    reminderMilestones: isEditing && selectedContest.reminderMilestones ? selectedContest.reminderMilestones.join(", ") : "25, 50, 75",
  });

  const [activeStep, setActiveStep] = useState<number>(1);
  const [inputNameError, setInputNameError] = useState<string>("");
  const [inputStartDateError, setInputStartDateError] = useState<string>("");
  const [inputEndDateError, setInputEndDateError] = useState<string>("");

  const { refetchContests, setRefetchContests, setIsEditingContest, setRefetchContestDetail, refetchContestDetail } = useContestStore();

  const onChangeStartDate = (event: any, selectedDate: any) => {
    if (selectedDate) {
      const currentDate = selectedDate || formData.startAt;
      setFormData((prev) => ({ ...prev, startAt: currentDate }));
      if (currentDate > formData.endAt) {
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 7);
        setFormData((prev) => ({ ...prev, endAt: endDate }));
      }
    }
  };

  const onChangeEndDate = (event: any, selectedDate: any) => {
    if (selectedDate) {
      const currentDate = selectedDate || formData.endAt;
      setFormData((prev) => ({ ...prev, endAt: currentDate }));
    }
  };

  const showAndroidDatePicker = (mode: "date" | "time", isStart: boolean) => {
    DateTimePickerAndroid.open({
      value: (isStart ? formData.startAt : formData.endAt) || new Date(),
      mode: "date",
      onChange: (event, selectedDate) => {
        if (event.type === "set" && selectedDate) {
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: "time",
            is24Hour: true,
            onChange: (eventTime, selectedTime) => {
              if (eventTime.type === "set" && selectedTime) {
                const combined = new Date(selectedDate);
                combined.setHours(selectedTime.getHours());
                combined.setMinutes(selectedTime.getMinutes());
                if (isStart) onChangeStartDate({ type: "set" }, combined);
                else onChangeEndDate({ type: "set" }, combined);
              }
            },
          });
        }
      },
    });
  };

  const handleStartDatePress = () => {
    setInputStartDateError("");
    if (Platform.OS === "android") showAndroidDatePicker("date", true);
    else setShowStartDate(true);
  };

  const handleEndDatePress = () => {
    setInputEndDateError("");
    if (Platform.OS === "android") showAndroidDatePicker("date", false);
    else setShowEndDate(true);
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const closeByDrag = (velocity: number) => {
    isClosingByDrag.current = true;
    Animated.timing(dragY, {
      toValue: SHEET_HEIGHT,
      duration: velocity > 1 ? 150 : 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => {
      slideAnim.setValue(SHEET_HEIGHT);
      dragY.setValue(0);
      onClose();
      setTimeout(() => { isClosingByDrag.current = false; }, 50);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => Keyboard.dismiss(),
      onPanResponderMove: (_, gestureState) => { if (gestureState.dy > 0) dragY.setValue(gestureState.dy); },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD || gestureState.vy > 0.5) closeByDrag(gestureState.vy);
        else Animated.spring(dragY, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 150 }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, useNativeDriver: true, duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }).start();
    } else if (!isClosingByDrag.current) {
      Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
  if (startPoint.coords && endPoint.coords) {
    fetchRoute(startPoint.coords, endPoint.coords);
  }
}, [startPoint.coords, endPoint.coords]);

  const translateY = Animated.add(slideAnim, dragY);

  const handleFinalSubmit = () => {
  const startCoords = startPoint.coords;
  const endCoords = endPoint.coords;

  const hasRoute =
    startCoords &&
    endCoords &&
    routePoints.length > 1;

  const payload = {
    ...formData,
    startAt: formData.startAt ? formData.startAt.toISOString() : null,
    endAt: formData.endAt ? formData.endAt.toISOString() : null,
    groupId: groupId,
    minPace: parseFloat(formData.minPace) || 0,
    maxPace: parseFloat(formData.maxPace) || 0,
    minDistance: parseFloat(formData.minDistance) || 0,
    reminderMilestones: formData.reminderMilestones
      ? formData.reminderMilestones
          .split(",")
          .map((s: string) => parseInt(s.trim()))
          .filter((n: number) => !isNaN(n) && n > 0 && n <= 100)
      : [25, 50, 75],

    route: hasRoute
      ? {
          startPoint: {
            latitude: startCoords.latitude,
            longitude: startCoords.longitude,
            order: 0,
            address: startPoint.address,
          },

          endPoint: {
            latitude: endCoords.latitude,
            longitude: endCoords.longitude,
            order: routePoints.length - 1,
            address: endPoint.address,
          },

          polyline: routePoints,

          checkpoints: routePoints.filter(
            (_: any, index: number) => index % 20 === 0
          ),

          distanceKm: routeDistance / 1000,
          toleranceMeters: 50,
          requiredMatchPercent: 80,
        }
      : undefined,
  };

  const action = isEditing
    ? UpdateContest(selectedContest._id, payload)
    : CreateContest(payload);

  action
    .then((res) => {
      if (res.data) {
        setRefetchContests(refetchContests + 1);

        if (isEditing) {
          setRefetchContestDetail(refetchContestDetail + 1);
          setIsEditingContest(false);
        }

        onClose();

        setTimeout(
          () =>
            toast.success(
              `${isEditing ? "Update" : "Create"} contest successfully`
            ),
          200
        );
      }
    })
    .catch((err) => toast.error(err.message || "An error occurred"));
};

  const getInputStyle = (hasError?: boolean) => ({
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: hasError ? "#EF4444" : "#E2E8F0",
    borderRadius: isAndroid ? 12 : 14,
    paddingHorizontal: 16,
    paddingVertical: isAndroid ? 12 : 14,
    fontSize: isAndroid ? 14 : 15,
    color: "#1F2937",
  });

  const FormLabel = ({ label, required, icon }: { label: string; required?: boolean; icon?: string }) => (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: isAndroid ? 8 : 10, gap: 6 }}>
      {icon && (
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#4F6AEE15", alignItems: "center", justifyContent: "center" }}>
          <Feather name={icon as any} size={14} color="#4F6AEE" />
        </View>
      )}
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>{label}{required && <Text style={{ color: "#EF4444" }}> *</Text>}</Text>
    </View>
  );

  const handleSearchLocation = async (query: string, setSuggestions: any) => {
  if (query.length < 3) return; // Chỉ tìm khi gõ trên 3 ký tự
  setLoadingSearch(true);
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&addressdetails=1`,
      { headers: { 'User-Agent': 'MyRunningApp' } } // Bắt buộc phải có tên app
    );
    const data = await response.json();
    const formattedData = data.map((item: any) => ({
      label: item.display_name,
      value: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) }
    }));
    setSuggestions(formattedData);
  } catch (error) {
    console.error(error);
  } finally {
    setLoadingSearch(false);
  }
};

  const fetchRoute = async (
  startCoords: any,
  endCoords: any
) => {
  try {
    setLoadingRoute(true);

    const url =
      `https://router.project-osrm.org/route/v1/foot/` +
      `${startCoords.longitude},${startCoords.latitude};` +
      `${endCoords.longitude},${endCoords.latitude}` +
      `?overview=full&geometries=geojson`;

    const response = await fetch(url);

    const data = await response.json();

    if (!data.routes?.length) {
      toast.error("Cannot create route");
      return;
    }

    const points = data.routes[0].geometry.coordinates.map(
      ([longitude, latitude]: [number, number], index: number) => ({
        latitude,
        longitude,
        order: index,
      })
    );

    setRoutePoints(points);

    setRouteDistance(data.routes[0].distance);
  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch route");
  } finally {
    setLoadingRoute(false);
  }
};

  return (
    <Animated.View style={{ backgroundColor: "#FFFFFF", width, borderTopLeftRadius: 24, borderTopRightRadius: 24, transform: [{ translateY }], height: SHEET_HEIGHT, elevation: 20 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.View {...panResponder.panHandlers} style={{ alignItems: "center", paddingVertical: 12 }}>
          <View style={{ width: 48, height: 5, backgroundColor: "#D0D0D0", borderRadius: 3 }} />
        </Animated.View>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1F2937" }}>{isEditing ? "Edit Contest" : "Create Contest"}</Text>
              <Text style={{ fontSize: 13, color: "#6B7280" }}>Step {activeStep} of 3</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Stepper (Updated to 3) */}
          <View style={{ flexDirection: "row", marginTop: 20, gap: 10 }}>
            {[1, 2, 3].map((step) => (
              <View key={step} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: activeStep >= step ? "#4F6AEE" : "#E5E7EB", alignItems: "center", justifyContent: "center" }}>
                  {activeStep > step ? <Feather name="check" size={14} color="#FFFFFF" /> : <Text style={{ color: activeStep >= step ? "#FFFFFF" : "#9CA3AF" }}>{step}</Text>}
                </View>
                {step < 3 && <View style={{ flex: 1, height: 2, backgroundColor: activeStep > step ? "#4F6AEE" : "#E5E7EB", marginHorizontal: 8 }} />}
              </View>
            ))}
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {activeStep === 1 && (
            <View style={{ gap: 20 }}>
              <View>
                <FormLabel label="Contest Name" required icon="award" />
                <TextInput style={getInputStyle(!!inputNameError)} value={formData.name} onChangeText={(t) => {setFormData(p => ({...p, name: t})); setInputNameError("")}} />
              </View>
              <View>
                <FormLabel label="Description" icon="file-text" />
                <TextInput style={{ ...getInputStyle(), height: computedDescHeight }} multiline value={formData.description} onChangeText={(t) => setFormData(p => ({...p, description: t}))} onContentSizeChange={(e) => setDescriptionHeight(e.nativeEvent.contentSize.height)} />
              </View>
              <View>
                <FormLabel label="Start Date & Time" required icon="calendar" />
                <TouchableOpacity onPress={handleStartDatePress} style={getInputStyle()}><Text>{formData.startAt ? formatDate(formData.startAt) : "Select date"}</Text></TouchableOpacity>
              </View>
              <View>
                <FormLabel label="End Date & Time" required icon="calendar" />
                <TouchableOpacity onPress={handleEndDatePress} style={getInputStyle()}><Text>{formData.endAt ? formatDate(formData.endAt) : "Select date"}</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {activeStep === 2 && (
            <View style={{ gap: 20 }}>
              <View><FormLabel label="Contest Type" icon="users" /><View style={getInputStyle()}><Dropdown data={contestType} labelField="label" valueField="value" value={formData.contestType === "Individual" ? 0 : 1} onChange={(item) => setFormData(p => ({ ...p, contestType: item.label }))} /></View></View>
              <View><FormLabel label="Activity Type" icon="activity" /><View style={getInputStyle()}><Dropdown data={contestActivityType} labelField="label" valueField="value" value={contestActivityType.find(t => t.label === formData.activityType)?.value} onChange={(item) => setFormData(p => ({ ...p, activityType: item.label }))} /></View></View>
              <View>
                <FormLabel label="Pace Range (min/km)" icon="zap" />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TextInput style={{...getInputStyle(), flex: 1}} placeholder="Min" keyboardType="numeric" value={formData.minPace.toString()} onChangeText={(t) => setFormData(p => ({...p, minPace: t}))} />
                  <TextInput style={{...getInputStyle(), flex: 1}} placeholder="Max" keyboardType="numeric" value={formData.maxPace.toString()} onChangeText={(t) => setFormData(p => ({...p, maxPace: t}))} />
                </View>
              </View>
              <View><FormLabel label="Minimum Distance (km)" icon="map-pin" /><TextInput style={getInputStyle()} keyboardType="numeric" value={formData.minDistance.toString()} onChangeText={(t) => setFormData(p => ({...p, minDistance: t}))} /></View>
              {/* FIX 2: Giữ Reminder Milestones ở Tab 2 đúng vị trí cũ */}
              <View>
                <FormLabel label="Reminder Milestones (%)" icon="bell" />
                <TextInput style={getInputStyle()} value={formData.reminderMilestones} onChangeText={(t) => setFormData(p => ({...p, reminderMilestones: t}))} />
              </View>
            </View>
          )}

          {activeStep === 3 && (
  <View style={{ gap: 15 }}>
    <FormLabel label="Race Route" icon="map" />

    {/* Dropdown Start Point */}
    <View style={{ zIndex: 3000 }}>
      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 5 }}>Start Point</Text>
      <Dropdown
        style={getInputStyle()}
        data={startSuggestions}
        search
        labelField="label"
        valueField="value"
        placeholder="Search start location..."
        onChangeText={(text) => handleSearchLocation(text, setStartSuggestions)}
        onChange={(item) => setStartPoint({ address: item.label, coords: item.value })}
      />
    </View>

    {/* Dropdown End Point */}
    <View style={{ zIndex: 2000 }}>
      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 5 }}>Finish Point</Text>
      <Dropdown
        style={getInputStyle()}
        data={endSuggestions}
        search
        labelField="label"
        valueField="value"
        placeholder="Search finish location..."
        onChangeText={(text) => handleSearchLocation(text, setEndSuggestions)}
        onChange={(item) => setEndPoint({ address: item.label, coords: item.value })}
      />
    </View>

    {/* Map View thu nhỏ */}
    <View style={{ height: 250, borderRadius: 15, overflow: 'hidden', marginTop: 10 }}>
      <MapView
        style={{ flex: 1 }}
        scrollEnabled={false} // Khóa để không bị xung đột với vuốt BottomSheet
        region={startPoint.coords ? {
          ...startPoint.coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        } : undefined}
      >
        {startPoint.coords && <Marker coordinate={startPoint.coords} title="Start" />}
        {endPoint.coords && <Marker coordinate={endPoint.coords} pinColor="green" title="Finish" />}
        
        {/* Route từ OSRM */}
        {routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeWidth={4}
            strokeColor="#4F6AEE"
          />
        )}
      </MapView>


    </View>

    {loadingRoute && (
  <Text style={{ marginTop: 8, fontSize: 13, color: "#6B7280" }}>
    Creating route...
  </Text>
)}

{routeDistance > 0 && (
  <Text
    style={{
      marginTop: 8,
      fontSize: 13,
      color: "#4B5563",
      fontWeight: "600",
    }}
  >
    Route distance: {(routeDistance / 1000).toFixed(2)} km
  </Text>
)}
  </View>
)}
        </ScrollView>

        {/* Footer Buttons: Logic 3 nút ở Tab 2 */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: isAndroid ? 20 : 34, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#F1F5F9", flexDirection: "row", gap: 10 }}>
          
          {/* Nút Back / Cancel */}
          <TouchableOpacity style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }} onPress={() => activeStep === 1 ? onClose() : setActiveStep(activeStep - 1)}>
            <Text style={{ fontWeight: "600", color: "#6B7280" }}>{activeStep === 1 ? "Cancel" : "Back"}</Text>
          </TouchableOpacity>

          {activeStep === 2 && (
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={handleFinalSubmit}>
              <LinearGradient colors={["#4F6AEE", "#9B4BE2"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontWeight: "600", color: "#FFFFFF" }} allowFontScaling={false}>{isEditing ? "Update" : "Create"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
  style={{ 
    flex: 1, 
    height: 52, 
    borderRadius: 14, 
    backgroundColor: "#F3F4F6", // Màu nền xám giống nút Back
    alignItems: "center", 
    justifyContent: "center",
    flexDirection: "row",
    gap: 6
  }} 
  onPress={() => activeStep === 3 ? handleFinalSubmit() : setActiveStep(activeStep + 1)}
>
  <Text 
    style={{ 
      fontWeight: "600", 
      color: "#6B7280" // Màu chữ ghi giống nút Back
    }}
    allowFontScaling={false}
  >
    {activeStep === 3 ? (isEditing ? "Update" : "Create") : "Next"}
  </Text>
  {activeStep < 3 && (
    <Feather name="arrow-right" size={16} color="#6B7280" />
  )}
</TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}