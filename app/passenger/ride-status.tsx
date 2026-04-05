import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapTilerView from "../../components/MapTilerView";

export default function PassengerRideStatus() {
  const router = useRouter();
  
  // Mock cycle of states: Searching -> Accepted -> Ongoing -> Completed
  const states = ["Searching", "Accepted", "Ongoing", "Completed"];
  const [statusIndex, setStatusIndex] = useState(0);

  // Auto-progress status every 3 seconds for mock demonstration
  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIndex((prev) => {
        if (prev === 2) {
          // Push to rating automatically after 'Ongoing' ends for flow visualization
          setTimeout(() => router.push("/passenger/rating"), 1000);
          return 3;
        }
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [router]);

  const currentStatus = states[statusIndex];

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
        <MapTilerView 
          center={[121.7260, 17.6185]} 
          zoom={15} 
          markers={
            currentStatus === "Searching" 
              ? [{ id: "p", lng: 121.7280, lat: 17.6190, emoji: "🧍" }] 
              : [{ id: "p", lng: 121.7280, lat: 17.6190, emoji: "🧍" }, { id: "d", lng: 121.7250, lat: 17.6180, emoji: "🛺" }] 
          } 
        />
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeaderRow}>
          <Text style={styles.statusText}>{currentStatus}...</Text>
          {currentStatus === "Searching" && <View style={styles.dotPulse} />}
        </View>
        
        {currentStatus !== "Searching" && (
          <View style={styles.driverInfo}>
            <View style={styles.driverPhotoPlaceholder}>
              <Text style={styles.driverInitials}>M</Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>Mario (Driver)</Text>
              <Text style={styles.tricycleDetails}>Tricycle • BGN 1234</Text>
            </View>
            <View style={styles.ratingBox}>
              <Text style={styles.ratingText}>⭐ 4.8</Text>
            </View>
          </View>
        )}

        {currentStatus !== "Completed" && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.replace("/passenger/home")}>
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
  
  driverMarker: {
    position: "absolute", top: "45%", left: "45%",
    width: 44, height: 44, backgroundColor: "#FF5E3A", borderRadius: 22,
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
  dotPulse: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#FF5E3A" },

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

  cancelButton: {
    height: 50, borderRadius: 12, borderWidth: 1, borderColor: "#FF3B30", 
    justifyContent: "center", alignItems: "center"
  },
  cancelButtonText: { color: "#FF3B30", fontSize: 16, fontWeight: "bold" },
});
