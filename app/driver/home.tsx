import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapTilerView from "../../components/MapTilerView";
import { auth, db } from "../../firebaseConfig";
import {
    acceptRideRequest,
    rejectRideRequest,
    subscribeIncomingRideRequests,
    subscribePlatformOverview,
    type DriverSummary,
    type PlatformOverviewListenerResult,
    type RideListenerResult,
} from "../service/ride";

export default function DriverHome() {
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [driverProfile, setDriverProfile] = useState<DriverSummary | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<RideListenerResult[]>([]);
  const [platformOverview, setPlatformOverview] = useState<PlatformOverviewListenerResult | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/sign-in");
        return;
      }

      const driverDoc = await getDoc(doc(db, "drivers", user.uid));
      const driverData = (driverDoc.data() || {}) as Record<string, unknown>;

      const nextProfile: DriverSummary = {
        uid: user.uid,
        fullName: typeof driverData.fullName === "string" ? driverData.fullName : user.displayName || "Driver",
        phone: typeof driverData.phone === "string" ? driverData.phone : "",
        profileImage: typeof driverData.profileImage === "string" ? driverData.profileImage : user.photoURL || "",
        isOnline: driverData.isOnline === true,
        approvalStatus: typeof driverData.approvalStatus === "string" ? driverData.approvalStatus : undefined,
        accountStatus: typeof driverData.accountStatus === "string" ? driverData.accountStatus : undefined,
        plateNumber: typeof driverData.plateNumber === "string" ? driverData.plateNumber : undefined,
        vehicleName: typeof driverData.vehicleName === "string" ? driverData.vehicleName : undefined,
        idType: typeof driverData.idType === "string" ? driverData.idType : undefined,
      };

      setDriverProfile(nextProfile);
      setIsOnline(nextProfile.isOnline);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!driverProfile?.uid) return;

    const unsubscribe = subscribeIncomingRideRequests(driverProfile.uid, setIncomingRequests);
    return () => unsubscribe();
  }, [driverProfile?.uid]);

  useEffect(() => {
    const unsubscribe = subscribePlatformOverview(setPlatformOverview);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!driverProfile?.uid || !isOnline) {
      return;
    }

    let locationSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startTracking = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Location needed", "Please allow location access so drivers can appear on the map.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextLocation = { lat: current.coords.latitude, lon: current.coords.longitude };

      if (!isMounted) return;
      setDriverLocation(nextLocation);

      await setDoc(
        doc(db, "drivers", driverProfile.uid),
        {
          currentLat: nextLocation.lat,
          currentLon: nextLocation.lon,
          currentLocationUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        async (position) => {
          if (!isMounted) return;

          const liveLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          setDriverLocation(liveLocation);

          await setDoc(
            doc(db, "drivers", driverProfile.uid),
            {
              currentLat: liveLocation.lat,
              currentLon: liveLocation.lon,
              currentLocationUpdatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      );
    };

    startTracking().catch(() => undefined);

    return () => {
      isMounted = false;
      locationSubscription?.remove();
    };
  }, [driverProfile?.uid, isOnline]);

  const currentRequest = useMemo(() => incomingRequests[0] || null, [incomingRequests]);
  const todayLabel = useMemo(() => {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return dayLabels[new Date().getDay()] || "Mon";
  }, []);

  const todayTrips = useMemo(() => {
    return platformOverview?.weeklyRides.find((item) => item.day === todayLabel)?.rides || 0;
  }, [platformOverview?.weeklyRides, todayLabel]);

  const liveEarnings = platformOverview?.revenue || 0;
  const livePendingRequests = incomingRequests.length;
  const currentFareType = currentRequest?.fareType === "discount" ? "Student / PWD" : "Regular";
  const currentFareRange = currentRequest?.fareType === "discount" ? "₱15-₱20" : "₱20-₱25";

  const handleToggleOnline = async () => {
    if (!driverProfile) {
      Alert.alert("Not signed in", "Please sign in again.");
      return;
    }

    const newStatus = !isOnline;
    setIsOnline(newStatus);

    try {
      await setDoc(
        doc(db, "drivers", driverProfile.uid),
        {
          isOnline: newStatus,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      setIsOnline(!newStatus);
      const message = error instanceof Error ? error.message : "Unable to update online status.";
      Alert.alert("Status Update Failed", message);
    }
  };

  const handleReject = async () => {
    if (!currentRequest) return;

    try {
      await rejectRideRequest(currentRequest.rideId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reject request.";
      Alert.alert("Reject Failed", message);
    }
  };

  const handleAccept = async () => {
    if (!currentRequest || !driverProfile) return;

    try {
      await acceptRideRequest(currentRequest.rideId, driverProfile);
      router.push(`/driver/ride-status?rideId=${currentRequest.rideId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to accept request.";
      Alert.alert("Accept Failed", message);
    }
  };

  const currentMarker = isOnline 
    ? [{ id: "self", lng: driverLocation?.lon || 121.7270, lat: driverLocation?.lat || 17.6186, emoji: "🛺" }] 
    : [];

  if (initializing) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#005EFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>TRISEE DRIVER</Text>
      </View>

      <View style={styles.mapContainer}>
        {/* Real Map Integration */}
        <MapTilerView center={[driverLocation?.lon || 121.7270, driverLocation?.lat || 17.6186]} zoom={15} markers={currentMarker} />
        
        {/* Toggle Online Button Header */}
        <View style={styles.statusBanner}>
          <TouchableOpacity 
            style={[styles.goOnlineButton, isOnline && styles.onlineActive]} 
            onPress={handleToggleOnline}
          >
            <Text style={styles.goOnlineText}>{isOnline ? "Go Offline" : "GO ONLINE"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mock Bottom Stats */}
      <View style={styles.bottomStats}>
        <Text style={styles.statsTitle}>Today's Activity</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{todayTrips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>₱{liveEarnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{livePendingRequests}</Text>
            <Text style={styles.statLabel}>Requests</Text>
          </View>
        </View>
      </View>

      {/* Incoming Booking Modal */}
      <Modal visible={Boolean(currentRequest && isOnline)} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.bookingCard}>
            <Text style={styles.newRequestTitle}>NEW RIDE REQUEST</Text>
            
            <View style={styles.passengerInfo}>
              <View style={styles.avatar}><Text>👤</Text></View>
              <View>
                <Text style={styles.pName}>{currentRequest?.passengerName || "Passenger"}</Text>
                <Text style={styles.pRating}>{currentRequest?.passengerPhone || "Cash booking"}</Text>
              </View>
              <Text style={styles.estimatedFare}>₱ {currentRequest?.fareAmount || 0}</Text>
            </View>

            <View style={styles.fareTypeRow}>
              <Text style={styles.fareTypeLabel}>Fare Type:</Text>
              <Text style={styles.fareTypeValue}>{currentFareType}</Text>
              <Text style={styles.fareTypeRange}>({currentFareRange})</Text>
            </View>

            <View style={styles.locations}>
              <Text style={styles.locLabel}>PICKUP</Text>
              <Text style={styles.locText}>{currentRequest?.pickupLocation || "Unknown pickup"}</Text>
              <Text style={styles.locLabel}>DROPOFF</Text>
              <Text style={styles.locText}>{currentRequest?.dropoffLocation || "Unknown dropoff"}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    height: 60, flexDirection: "row", justifyContent: "center", alignItems: "center",
    paddingHorizontal: 16, backgroundColor: "#fff", zIndex: 10,
    elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  appTitle: { fontSize: 18, fontWeight: "800", color: "#2E3A59", letterSpacing: 1 },
  
  mapContainer: { flex: 1, position: "relative" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  statusBanner: { position: "absolute", top: 20, left: 0, right: 0, alignItems: "center" },
  goOnlineButton: { 
    backgroundColor: "#2E3A59", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 6 
  },
  onlineActive: { backgroundColor: "#005EFF" },
  goOnlineText: { color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 1 },

  bottomStats: {
    padding: 24, paddingBottom: 40, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, marginTop: -20
  },
  statsTitle: { fontSize: 18, fontWeight: "bold", color: "#2E3A59", marginBottom: 16 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statBox: { alignItems: "center", backgroundColor: "#F7F9FC", flex: 1, marginHorizontal: 4, paddingVertical: 12, borderRadius: 12 },
  statNumber: { fontSize: 20, fontWeight: "bold", color: "#005EFF" },
  statLabel: { fontSize: 12, color: "#8E99B3", marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  bookingCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  newRequestTitle: { fontSize: 14, fontWeight: "bold", color: "#8E99B3", letterSpacing: 1, marginBottom: 16, textAlign: "center" },
  passengerInfo: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#EDF1F7", justifyContent: "center", alignItems: "center", marginRight: 16 },
  pName: { fontSize: 18, fontWeight: "bold", color: "#2E3A59" },
  pRating: { fontSize: 13, color: "#8E99B3", marginTop: 2 },
  estimatedFare: { fontSize: 24, fontWeight: "bold", color: "#00BA61", marginLeft: "auto" },
  fareTypeRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, marginTop: -4 },
  fareTypeLabel: { fontSize: 13, color: "#8E99B3", fontWeight: "700" },
  fareTypeValue: { fontSize: 13, color: "#2E3A59", fontWeight: "800", marginLeft: 6 },
  fareTypeRange: { fontSize: 12, color: "#8E99B3", fontWeight: "700", marginLeft: 4 },

  locations: { backgroundColor: "#F7F9FC", padding: 16, borderRadius: 12, marginBottom: 24 },
  locLabel: { fontSize: 11, fontWeight: "bold", color: "#8E99B3", marginBottom: 4 },
  locText: { fontSize: 16, color: "#2E3A59", marginBottom: 12, fontWeight: "500" },
  
  actionRow: { flexDirection: "row", gap: 12 },
  rejectBtn: { flex: 1, height: 54, borderRadius: 12, borderWidth: 1, borderColor: "#FF3B30", justifyContent: "center", alignItems: "center" },
  rejectText: { color: "#FF3B30", fontSize: 16, fontWeight: "bold" },
  acceptBtn: { flex: 2, height: 54, borderRadius: 12, backgroundColor: "#00BA61", justifyContent: "center", alignItems: "center" },
  acceptText: { color: "#fff", fontSize: 16, fontWeight: "bold" }
});
