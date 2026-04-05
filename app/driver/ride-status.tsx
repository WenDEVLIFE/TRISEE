import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapTilerView from "../../components/MapTilerView";
import { completeRideAndRecord, subscribeRideById, updateRideStage, type RideListenerResult } from "../service/ride";

export default function DriverRideStatus() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = typeof params.rideId === "string" ? params.rideId : "";
  const stages = ["accepted", "arrived", "ongoing", "completed"] as const;
  const [ride, setRide] = useState<RideListenerResult | null>(null);
  const [loading, setLoading] = useState(true);
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

  const currentStage = useMemo(() => {
    const status = ride?.status || "accepted";
    return Math.max(0, stages.indexOf(status as (typeof stages)[number]));
  }, [ride?.status]);

  const handleNextStage = async () => {
    if (!rideId) {
      Alert.alert("Missing ride", "Ride session not found.");
      return;
    }

    try {
      if (currentStage === 0) {
        await updateRideStage(rideId, "arrived");
      } else if (currentStage === 1) {
        await updateRideStage(rideId, "ongoing");
      } else if (currentStage === 2) {
        await completeRideAndRecord(rideId, ride?.fareAmount);
        router.replace("/driver/home");
      } else {
        router.replace("/driver/home");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update ride.";
      Alert.alert("Update failed", message);
    }
  };

  const statusText = ride?.status || "accepted";
  const readableStatus = {
    accepted: "Accepted",
    arrived: "Arrived",
    ongoing: "Ongoing",
    completed: "Completed",
    cancelled: "Cancelled",
  }[statusText] || "Accepted";

  const mapConfig = useMemo(() => {
    const passengerMarker = { id: "p", lng: 121.7280, lat: 17.6190, emoji: "🧍" };
    const driverMarker = { id: "d", lng: 121.7250, lat: 17.6180, emoji: "🛺" };
    const pickupMarker = { id: "pickup", lng: 121.7280, lat: 17.6190, emoji: "📍" };
    const dropoffMarker = { id: "dropoff", lng: 121.7250, lat: 17.6180, emoji: "🏁" };

    if (mapView === "pickup") {
      return {
        center: [pickupMarker.lng, pickupMarker.lat] as [number, number],
        zoom: 16,
        markers: [driverMarker, pickupMarker],
      };
    }

    if (mapView === "dropoff") {
      return {
        center: [dropoffMarker.lng, dropoffMarker.lat] as [number, number],
        zoom: 16,
        markers: [driverMarker, dropoffMarker],
      };
    }

    return {
      center: [121.7260, 17.6185] as [number, number],
      zoom: 15,
      markers: [passengerMarker, driverMarker, pickupMarker, dropoffMarker],
    };
  }, [mapView]);

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
        <Text style={styles.title}>{ride?.dropoffLocation || "Trip Status"}</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapTilerView center={mapConfig.center} zoom={mapConfig.zoom} markers={mapConfig.markers} />
      </View>

      <View style={styles.statusCard}>
        <View style={styles.passengerInfo}>
          <View style={styles.avatar}><Text>👤</Text></View>
          <View style={styles.infoText}>
            <Text style={styles.name}>{ride?.passengerName || "Passenger"}</Text>
            <Text style={styles.payment}>Cash • ₱ {ride?.fareAmount || 0}</Text>
          </View>
          <TouchableOpacity style={styles.callIcon}>
            <Text style={styles.phoneIcon}>📞</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.currentStatus}>{readableStatus}</Text>
          <View style={styles.progressBar}>
            {stages.map((_, index) => (
              <View 
                key={index} 
                style={[styles.progressTick, index <= currentStage && styles.progressTickActive]} 
              />
            ))}
          </View>
        </View>

        <View style={styles.navigationBox}>
          <Text style={styles.navigationTitle}>In-App Navigation</Text>
          <Text style={styles.navigationText}>Pickup: {ride?.pickupLocation || "Not set"}</Text>
          <Text style={styles.navigationText}>Drop-off: {ride?.dropoffLocation || "Not set"}</Text>

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

        {statusText !== "completed" ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.replace("/driver/home")}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleNextStage}
            >
              <Text style={styles.primaryBtnText}>
                {currentStage === 0 ? "I've Arrived" : currentStage === 1 ? "Start Trip" : "Complete Trip & Collect Cash"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.completeBtn} onPress={() => router.replace("/driver/home")}>
            <Text style={styles.completeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 60, justifyContent: "center", alignItems: "center",
    backgroundColor: "#fff", zIndex: 10,
    elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  title: { fontSize: 18, fontWeight: "600", color: "#2E3A59" },

  mapContainer: { flex: 1 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },

  statusCard: {
    padding: 24, paddingBottom: 40, backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20,
    elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  
  passengerInfo: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#E3FFF1", justifyContent: "center", alignItems: "center" },
  infoText: { flex: 1, marginLeft: 16 },
  name: { fontSize: 18, fontWeight: "bold", color: "#2E3A59" },
  payment: { fontSize: 14, color: "#00BA61", fontWeight: "600", marginTop: 4 },
  callIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F7F9FC", justifyContent: "center", alignItems: "center" },
  phoneIcon: { fontSize: 20 },

  progressContainer: { marginBottom: 24, backgroundColor: "#F7F9FC", padding: 16, borderRadius: 12 },
  currentStatus: { fontSize: 16, fontWeight: "bold", color: "#2E3A59", marginBottom: 12, textAlign: "center" },
  progressBar: { flexDirection: "row", gap: 8 },
  progressTick: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "#EDF1F7" },
  progressTickActive: { backgroundColor: "#005EFF" },

  navigationBox: {
    backgroundColor: "#F7F9FC",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EDF1F7",
  },
  navigationTitle: { fontSize: 15, fontWeight: "800", color: "#2E3A59", marginBottom: 10 },
  navigationText: { fontSize: 13, color: "#2E3A59", marginBottom: 6, fontWeight: "600" },
  navigationRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  navigationButton: { flex: 1, minHeight: 44, borderRadius: 10, justifyContent: "center", alignItems: "center", paddingHorizontal: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  navigationButtonActive: { backgroundColor: "#005EFF", borderColor: "#005EFF" },
  navigationButtonText: { color: "#2E3A59", fontSize: 12, fontWeight: "800", textAlign: "center" },
  navigationButtonTextActive: { color: "#fff" },

  actionRow: { flexDirection: "row", gap: 12 },
  cancelBtn: { height: 54, paddingHorizontal: 24, borderRadius: 12, backgroundColor: "#F7F9FC", justifyContent: "center", alignItems: "center" },
  cancelText: { color: "#FF3B30", fontSize: 16, fontWeight: "bold" },
  primaryBtn: { flex: 1, height: 54, borderRadius: 12, backgroundColor: "#005EFF", justifyContent: "center", alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  completeBtn: { height: 54, borderRadius: 12, backgroundColor: "#00BA61", justifyContent: "center", alignItems: "center" },
  completeBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
