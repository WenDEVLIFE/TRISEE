import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapTilerView from "../../components/MapTilerView";

export default function DriverRideStatus() {
  const router = useRouter();
  const stages = ["Accepted", "Arrived", "Ongoing", "Completed"];
  const [currentStage, setCurrentStage] = useState(0);

  const handleNextStage = () => {
    if (currentStage === 3) {
      router.replace("/driver/home"); // Go back to dashboard after complete
    } else {
      setCurrentStage((prev) => prev + 1);
    }
  };

  const statusText = stages[currentStage];
  
  // Passenger coordinate for mock map
  const pMarker = { id: "p", lng: 121.7280, lat: 17.6190, emoji: "🧍" };
  const dMarker = { id: "d", lng: 121.7250, lat: 17.6180, emoji: "🛺" };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip to Buntun Bridge</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapTilerView center={[121.7260, 17.6185]} zoom={15} markers={[pMarker, dMarker]} />
      </View>

      <View style={styles.statusCard}>
        <View style={styles.passengerInfo}>
          <View style={styles.avatar}><Text>👤</Text></View>
          <View style={styles.infoText}>
            <Text style={styles.name}>John Dela Cruz</Text>
            <Text style={styles.payment}>Cash • ₱ 50</Text>
          </View>
          <TouchableOpacity style={styles.callIcon}>
            <Text style={styles.phoneIcon}>📞</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.currentStatus}>{statusText}</Text>
          <View style={styles.progressBar}>
            {stages.map((_, index) => (
              <View 
                key={index} 
                style={[styles.progressTick, index <= currentStage && styles.progressTickActive]} 
              />
            ))}
          </View>
        </View>

        {currentStage < 3 ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.replace("/driver/home")}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleNextStage}
            >
              <Text style={styles.primaryBtnText}>
                {currentStage === 0 ? "I've Arrived" : "Start Trip"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.completeBtn} onPress={handleNextStage}>
            <Text style={styles.completeBtnText}>Complete Trip & Collect Cash</Text>
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

  actionRow: { flexDirection: "row", gap: 12 },
  cancelBtn: { height: 54, paddingHorizontal: 24, borderRadius: 12, backgroundColor: "#F7F9FC", justifyContent: "center", alignItems: "center" },
  cancelText: { color: "#FF3B30", fontSize: 16, fontWeight: "bold" },
  primaryBtn: { flex: 1, height: 54, borderRadius: 12, backgroundColor: "#005EFF", justifyContent: "center", alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  completeBtn: { height: 54, borderRadius: 12, backgroundColor: "#00BA61", justifyContent: "center", alignItems: "center" },
  completeBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
