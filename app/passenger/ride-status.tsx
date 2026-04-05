import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapTilerView from "../../components/MapTilerView";
import { cancelRide, subscribeRideById, type RideListenerResult } from "../service/ride";

export default function PassengerRideStatus() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = typeof params.rideId === "string" ? params.rideId : "";
  const [ride, setRide] = useState<RideListenerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const redirectedToRating = useRef(false);
  const [mapView, setMapView] = useState<"overview" | "pickup" | "dropoff">("overview");

  useEffect(() => {
    if (!rideId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeRideById(rideId, (nextRide) => {
      setRide(nextRide);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [rideId]);

  useEffect(() => {
    if (ride?.status === "completed" && !redirectedToRating.current && rideId) {
      redirectedToRating.current = true;
      const timer = setTimeout(() => {
        router.replace(`/passenger/rating?rideId=${rideId}`);
      }, 1200);

      return () => clearTimeout(timer);
    }

    if (ride?.status !== "completed") {
      redirectedToRating.current = false;
    }

    return undefined;
  }, [ride?.status, rideId, router]);

  const currentStatus = ride?.status || "searching";
  const currentStatusLabel = useMemo(() => {
    const labels: Record<string, string> = {
      searching: "Searching",
      accepted: "Accepted",
      arrived: "Arrived",
      ongoing: "Ongoing",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return labels[currentStatus] || "Searching";
  }, [currentStatus]);

  const mapConfig = useMemo(() => {
    const passengerMarker = { id: "p", lng: 121.7270, lat: 17.6186, emoji: "🧍" };
    const pickupMarker = { id: "pickup", lng: 121.7280, lat: 17.6190, emoji: "📍" };
    const dropoffMarker = { id: "dropoff", lng: 121.7250, lat: 17.6180, emoji: "🏁" };

    if (mapView === "pickup") {
      return { center: [pickupMarker.lng, pickupMarker.lat] as [number, number], zoom: 16, markers: [passengerMarker, pickupMarker] };
    }

    if (mapView === "dropoff") {
      return { center: [dropoffMarker.lng, dropoffMarker.lat] as [number, number], zoom: 16, markers: [passengerMarker, dropoffMarker] };
    }

    return { center: [121.7260, 17.6185] as [number, number], zoom: 15, markers: [passengerMarker, pickupMarker, dropoffMarker] };
  }, [mapView]);

  const handleCancelRide = async () => {
    if (!rideId) {
      Alert.alert("Missing ride", "Ride session not found.");
      return;
    }

    try {
      await cancelRide(rideId);
      router.replace("/passenger/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to cancel booking.";
      Alert.alert("Cancel failed", message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#005EFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ride Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mapContainer}>
        <MapTilerView center={mapConfig.center} zoom={mapConfig.zoom} markers={mapConfig.markers} />
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeaderRow}>
          <Text style={styles.statusText}>{currentStatusLabel}...</Text>
          {currentStatus === "searching" && <View style={styles.dotPulse} />}
        </View>

        {ride ? (
          <View style={styles.driverInfo}>
            <View style={styles.driverPhotoPlaceholder}>
              <Text style={styles.driverInitials}>{ride.assignedDriverName?.charAt(0)?.toUpperCase() || "D"}</Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{ride.assignedDriverName || "Driver"}</Text>
              <Text style={styles.tricycleDetails}>{ride.assignedDriverPhone || "Waiting for driver details"}</Text>
            </View>
            <View style={styles.ratingBox}>
              <Text style={styles.ratingText}>₱ {ride.fareAmount || 0}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.driverInfo}>
            <View style={styles.driverPhotoPlaceholder}>
              <Text style={styles.driverInitials}>⏳</Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>Waiting for driver...</Text>
              <Text style={styles.tricycleDetails}>Your request is being processed</Text>
            </View>
          </View>
        )}

        <View style={styles.tripBox}>
          <Text style={styles.tripLabel}>Pickup</Text>
          <Text style={styles.tripValue}>{ride?.pickupLocation || "Current Location"}</Text>
          <Text style={styles.tripLabel}>Drop-off</Text>
          <Text style={styles.tripValue}>{ride?.dropoffLocation || "Destination"}</Text>
        </View>

        <View style={styles.navigationBox}>
          <Text style={styles.navigationTitle}>In-App Navigation</Text>
          <View style={styles.navigationRow}>
            <TouchableOpacity
              style={[styles.navigationButton, mapView === "overview" && styles.navigationButtonActive]}
              onPress={() => setMapView("overview")}
            >
              <Text style={[styles.navigationButtonText, mapView === "overview" && styles.navigationButtonTextActive]}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navigationButton, mapView === "pickup" && styles.navigationButtonActive]}
              onPress={() => setMapView("pickup")}
            >
              <Text style={[styles.navigationButtonText, mapView === "pickup" && styles.navigationButtonTextActive]}>Pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navigationButton, mapView === "dropoff" && styles.navigationButtonActive]}
              onPress={() => setMapView("dropoff")}
            >
              <Text style={[styles.navigationButtonText, mapView === "dropoff" && styles.navigationButtonTextActive]}>Drop-off</Text>
            </TouchableOpacity>
          </View>
        </View>

        {currentStatus !== "completed" && currentStatus !== "cancelled" && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, backgroundColor: "#fff", zIndex: 10,
    elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  backText: { fontSize: 24, color: "#2E3A59" },
  title: { fontSize: 18, fontWeight: "600", color: "#2E3A59" },

  mapContainer: { flex: 1, position: "relative", backgroundColor: "#e8edea" },
  mapImage: { width: "100%", height: "100%", opacity: 0.6 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  
  driverMarker: {
    position: "absolute", top: "45%", left: "45%",
    width: 44, height: 44, backgroundColor: "#005EFF", borderRadius: 22,
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "#fff",
    elevation: 6
  },
  markerEmoji: { fontSize: 20 },

  statusCard: {
    padding: 24, paddingBottom: 40, backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20,
    elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  statusHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  statusText: { fontSize: 22, fontWeight: "bold", color: "#2E3A59" },
  dotPulse: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#005EFF" },

  driverInfo: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F7F9FC", padding: 16, borderRadius: 12, marginBottom: 20
  },
  driverPhotoPlaceholder: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: "#2E3A59", justifyContent: "center", alignItems: "center"
  },
  driverInitials: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  driverDetails: { flex: 1, marginLeft: 16 },
  driverName: { fontSize: 16, fontWeight: "bold", color: "#2E3A59" },
  tricycleDetails: { fontSize: 14, color: "#8E99B3", marginTop: 4 },
  ratingBox: { backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: 12, fontWeight: "bold" },

  tripBox: { backgroundColor: "#F7F9FC", padding: 16, borderRadius: 12, marginBottom: 24 },
  tripLabel: { fontSize: 11, fontWeight: "bold", color: "#8E99B3", marginBottom: 4, marginTop: 6 },
  tripValue: { fontSize: 16, color: "#2E3A59", marginBottom: 6, fontWeight: "600" },

  navigationBox: { backgroundColor: "#F7F9FC", padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: "#EDF1F7" },
  navigationTitle: { fontSize: 15, fontWeight: "800", color: "#2E3A59", marginBottom: 10 },
  navigationRow: { flexDirection: "row", gap: 8 },
  navigationButton: { flex: 1, minHeight: 44, borderRadius: 10, justifyContent: "center", alignItems: "center", paddingHorizontal: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  navigationButtonActive: { backgroundColor: "#005EFF", borderColor: "#005EFF" },
  navigationButtonText: { color: "#2E3A59", fontSize: 12, fontWeight: "800", textAlign: "center" },
  navigationButtonTextActive: { color: "#fff" },

  cancelButton: {
    height: 50, borderRadius: 12, borderWidth: 1, borderColor: "#FF3B30", 
    justifyContent: "center", alignItems: "center"
  },
  cancelButtonText: { color: "#FF3B30", fontSize: 16, fontWeight: "bold" },
});
