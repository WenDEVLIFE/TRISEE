import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddressPickerModal from "../../components/AddressPickerModal";
import MapTilerView from "../../components/MapTilerView";
import { auth } from "../../firebaseConfig";
import { AddressSuggestion } from "../service/location";
import { createRideRequest, subscribeAvailableDrivers, type AvailableDriver } from "../service/ride";

export default function PassengerHome() {
  const router = useRouter();
  const [pickupLocation, setPickupLocation] = useState<AddressSuggestion | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<AddressSuggestion | null>(null);
  const [activePicker, setActivePicker] = useState<"pickup" | "dropoff" | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<AvailableDriver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [fareType, setFareType] = useState<"regular" | "discount">("regular");
  const [isBooking, setIsBooking] = useState(false);
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAvailableDrivers((drivers) => {
      setNearbyDrivers(drivers);
      setSelectedDriverId((currentSelected) => {
        if (currentSelected && drivers.some((driver) => driver.uid === currentSelected)) {
          return currentSelected;
        }

        return drivers[0]?.uid || "";
      });
    });

    return () => unsubscribe();
  }, []);

  const selectedDriver = useMemo(
    () => nearbyDrivers.find((driver) => driver.uid === selectedDriverId) || null,
    [nearbyDrivers, selectedDriverId]
  );
  const driverMarkers = useMemo(
    () =>
      nearbyDrivers
        .filter((driver) => typeof driver.currentLat === "number" && typeof driver.currentLon === "number")
        .map((driver) => ({
          id: driver.uid,
          lng: driver.currentLon as number,
          lat: driver.currentLat as number,
          emoji: driver.uid === selectedDriverId ? "⭐" : "🛺",
        })),
    [nearbyDrivers, selectedDriverId]
  );

  const estimatedFareAmount = fareType === "regular" ? 20 : 15;
  const estimatedFareMinimumLabel = fareType === "regular" ? "20 php minimum" : "15 php minimum";
  const selectedFareTypeLabel = fareType === "regular" ? "Regular" : "Student / PWD";
  const canSubmitBooking = Boolean(pickupLocation && dropoffLocation && selectedDriver && !isBooking);
  const pickupLabel = pickupLocation?.displayName || "Select pickup location";
  const dropoffLabel = dropoffLocation?.displayName || "Select drop-off location";
  const mapCenter: [number, number] = pickupLocation
    ? [pickupLocation.lon, pickupLocation.lat]
    : driverMarkers[0]
      ? [driverMarkers[0].lng, driverMarkers[0].lat]
      : [121.7270, 17.6186];

  const mapMarkers = [
    ...(pickupLocation
      ? [
          {
            id: "pickup",
            lng: pickupLocation.lon,
            lat: pickupLocation.lat,
            emoji: "🧍",
          },
        ]
      : []),
    ...(dropoffLocation
      ? [
          {
            id: "dropoff",
            lng: dropoffLocation.lon,
            lat: dropoffLocation.lat,
            emoji: "📍",
          },
        ]
      : []),
    ...driverMarkers,
  ];

  const handleBookRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert("Missing details", "Please select both pickup and drop-off locations.");
      return;
    }

    if (!selectedDriver) {
      Alert.alert("No drivers available", "Please wait until a nearby driver is online.");
      return;
    }

    if (pickupLocation.placeId === dropoffLocation.placeId) {
      Alert.alert("Invalid route", "Pickup and drop-off locations should be different.");
      return;
    }

    try {
      setIsBooking(true);
      const user = auth.currentUser;
      const rideId = await createRideRequest({
        passengerUid: user?.uid || "",
        passengerName: user?.displayName || "",
        passengerPhone: user?.phoneNumber || "",
        assignedDriverId: selectedDriver.uid,
        assignedDriverName: selectedDriver.fullName,
        assignedDriverPhone: selectedDriver.phone,
        pickupLocation: `${pickupLocation.displayName} (${pickupLocation.lat.toFixed(5)}, ${pickupLocation.lon.toFixed(5)})`,
        dropoffLocation: `${dropoffLocation.displayName} (${dropoffLocation.lat.toFixed(5)}, ${dropoffLocation.lon.toFixed(5)})`,
        fareType,
        fareAmount: estimatedFareAmount,
      });

      router.push(`/passenger/ride-status?rideId=${rideId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to book ride.";
      Alert.alert("Booking failed", message);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push("/passenger/profile") }>
          <Text style={styles.avatarIcon}>👤</Text>
        </TouchableOpacity>
        <Text style={styles.appTitle}>TRISEE</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push("/passenger/history")}>
          <Text style={styles.menuIcon}>📄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapTilerView center={mapCenter} zoom={14} markers={mapMarkers} />

        <TouchableOpacity style={styles.floatingBookButton} onPress={() => setIsBookingSheetOpen((value) => !value)}>
          <Ionicons name={isBookingSheetOpen ? "close" : "add"} size={20} color="#fff" />
          <Text style={styles.floatingBookText}>{isBookingSheetOpen ? "Close" : "Book a Ride"}</Text>
        </TouchableOpacity>
      </View>

      {isBookingSheetOpen && (
        <View style={styles.sheetWrapper}>
          <ScrollView style={styles.bottomSheet} contentContainerStyle={styles.bottomSheetContent} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Book a Ride</Text>
              <TouchableOpacity style={styles.sheetCloseButton} onPress={() => setIsBookingSheetOpen(false)}>
                <Ionicons name="chevron-down" size={18} color="#2E3A59" />
              </TouchableOpacity>
            </View>

            <View style={styles.locationInputBox}>
              <View style={styles.dotLine}>
                <View style={[styles.dot, { backgroundColor: "#005EFF" }]} />
                <View style={styles.line} />
                <View style={[styles.square, { backgroundColor: "#2E3A59" }]} />
              </View>

              <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.locationButton} onPress={() => setActivePicker("pickup")}>
                  <Text style={[styles.locationButtonText, !pickupLocation && styles.locationPlaceholder]} numberOfLines={2}>
                    {pickupLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#8E99B3" />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.locationButton} onPress={() => setActivePicker("dropoff")}>
                  <Text style={[styles.locationButtonText, !dropoffLocation && styles.locationPlaceholder]} numberOfLines={2}>
                    {dropoffLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#8E99B3" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.nearbyHeaderRow}>
              <Text style={styles.sectionTitle}>Nearby Drivers</Text>
              <Text style={styles.sectionSubtitle}>{nearbyDrivers.length} online</Text>
            </View>

            {nearbyDrivers.length === 0 ? (
              <View style={styles.emptyDriversBox}>
                <ActivityIndicator size="small" color="#005EFF" />
                <Text style={styles.emptyDriversText}>Waiting for drivers to come online...</Text>
              </View>
            ) : (
              <View style={styles.driverList}>
                {nearbyDrivers.map((driver) => {
                  const isSelected = selectedDriverId === driver.uid;
                  return (
                    <TouchableOpacity
                      key={driver.uid}
                      style={[styles.driverCard, isSelected && styles.driverCardSelected]}
                      onPress={() => setSelectedDriverId(driver.uid)}
                    >
                      <View style={styles.driverAvatar}>
                        {driver.profileImage ? <Text style={styles.driverAvatarEmoji}>🧑‍✈️</Text> : <Text style={styles.driverAvatarEmoji}>🛺</Text>}
                      </View>
                      <View style={styles.driverInfo}>
                        <Text style={styles.driverName}>{driver.fullName}</Text>
                        <Text style={styles.driverMeta} numberOfLines={1}>
                          {driver.vehicleName || "Tricycle"}
                          {driver.plateNumber ? ` • ${driver.plateNumber}` : ""}
                        </Text>
                      </View>
                      <View style={styles.driverSelectDot}>{isSelected ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}</View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Fare Type</Text>
              <View style={styles.fareTypeSwitchRow}>
                <TouchableOpacity
                  style={[styles.fareTypeChip, fareType === "regular" && styles.fareTypeChipActive]}
                  onPress={() => setFareType("regular")}
                >
                  <Text style={[styles.fareTypeChipText, fareType === "regular" && styles.fareTypeChipTextActive]}>Regular</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fareTypeChip, fareType === "discount" && styles.fareTypeChipActive]}
                  onPress={() => setFareType("discount")}
                >
                  <Text style={[styles.fareTypeChipText, fareType === "discount" && styles.fareTypeChipTextActive]}>Student / PWD</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Estimated Fare ({selectedFareTypeLabel})</Text>
              <Text style={styles.fareValue}>{estimatedFareMinimumLabel}</Text>
            </View>
            <Text style={styles.fareHint}>Cash only • Final fare may vary slightly by exact route.</Text>

            <TouchableOpacity
              style={[styles.bookButton, !canSubmitBooking && styles.bookButtonDisabled]}
              onPress={handleBookRide}
              disabled={!canSubmitBooking}
            >
              {isBooking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.bookButtonText}>
                  Book Ride{selectedDriver ? ` with ${selectedDriver.fullName}` : ""}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <AddressPickerModal
        visible={activePicker !== null}
        title={activePicker === "pickup" ? "Pick your pickup location" : "Pick your drop-off location"}
        subtitle={activePicker === "pickup" ? "Select your current location or search nearby places." : "Search and select where you want to go."}
        allowCurrentLocation={activePicker === "pickup"}
        onClose={() => setActivePicker(null)}
        onSelect={(address) => {
          if (activePicker === "pickup") {
            setPickupLocation(address);
          } else if (activePicker === "dropoff") {
            setDropoffLocation(address);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    height: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, backgroundColor: "#fff", zIndex: 10,
    elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  menuButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F9FC", borderRadius: 20 },
  avatarIcon: { fontSize: 20 },
  menuIcon: { fontSize: 20 },
  appTitle: { fontSize: 20, fontWeight: "800", color: "#005EFF", letterSpacing: 1 },
  
  mapContainer: { flex: 1, position: "relative", backgroundColor: "#e8edea" },
  mapImage: { width: "100%", height: "100%", resizeMode: "cover", opacity: 0.7 },
  mockMarker: {
    position: "absolute", top: "50%", left: "40%", width: 36, height: 36,
    backgroundColor: "#fff", borderRadius: 18, justifyContent: "center", alignItems: "center",
    elevation: 5, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3
  },
  markerText: { fontSize: 18 },

  bottomSheet: {
    maxHeight: "78%",
    backgroundColor: "#fff",
  },
  bottomSheetContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#fff",
  },
  floatingBookButton: {
    position: "absolute",
    right: 16,
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#005EFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  floatingBookText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  sheetWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#E6ECF5",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sheetCloseButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F7F9FC", alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontSize: 22, fontWeight: "bold", color: "#2E3A59" },
  
  locationInputBox: {
    flexDirection: "row", backgroundColor: "#F7F9FC", borderRadius: 12, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: "#EDF1F7"
  },
  dotLine: { width: 24, alignItems: "center", paddingTop: 8, paddingBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { flex: 1, width: 2, backgroundColor: "#EDF1F7", marginVertical: 4 },
  square: { width: 10, height: 10 },
  
  inputContainer: { flex: 1 },
  locationButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  locationButtonText: { flex: 1, fontSize: 15, color: "#2E3A59", fontWeight: "600" },
  locationPlaceholder: { color: "#8E99B3", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#EDF1F7", marginVertical: 4 },

  nearbyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderColor: "#EDF1F7",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#2E3A59" },
  sectionSubtitle: { fontSize: 12, color: "#8E99B3", fontWeight: "600" },
  emptyDriversBox: { paddingVertical: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F9FC", borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#EDF1F7" },
  emptyDriversText: { marginTop: 8, color: "#8E99B3", fontSize: 13, fontWeight: "600", textAlign: "center" },
  driverList: { marginBottom: 6 },
  driverCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#F7F9FC", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#DCE4F2" },
  driverCardSelected: { borderColor: "#005EFF", backgroundColor: "#EEF4FF" },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginRight: 12 },
  driverAvatarEmoji: { fontSize: 18 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: "700", color: "#2E3A59" },
  driverMeta: { marginTop: 2, fontSize: 12, color: "#8E99B3", fontWeight: "600" },
  driverSelectDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#005EFF", justifyContent: "center", alignItems: "center" },

  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EDF1F7",
  },
  fareLabel: { fontSize: 14, color: "#8E99B3", fontWeight: "700" },
  fareValue: { fontSize: 18, color: "#005EFF", fontWeight: "800" },
  fareTypeSwitchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fareTypeChip: {
    borderWidth: 1,
    borderColor: "#D9E2F2",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  fareTypeChipActive: {
    borderColor: "#005EFF",
    backgroundColor: "#EEF4FF",
  },
  fareTypeChipText: {
    fontSize: 12,
    color: "#5C6B88",
    fontWeight: "700",
  },
  fareTypeChipTextActive: {
    color: "#005EFF",
  },
  fareHint: {
    marginTop: -2,
    marginBottom: 10,
    fontSize: 12,
    color: "#8E99B3",
    fontWeight: "600",
  },

  bookButton: {
    backgroundColor: "#005EFF", height: 54, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 2
  },
  bookButtonDisabled: {
    backgroundColor: "#9DBAF9",
  },
  bookButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
