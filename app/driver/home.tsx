import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapTilerView from "../../components/MapTilerView";

export default function DriverHome() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  // Mock auto-triggering a request when driver goes online
  const handleToggleOnline = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    if (newStatus) {
      setTimeout(() => setShowRequest(true), 3000); // simulate request after 3s
    }
  };

  const currentMarker = isOnline 
    ? [{ id: "self", lng: 121.7270, lat: 17.6186, emoji: "🛺" }] 
    : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push("/driver/profile")}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.appTitle}>TRISEE DRIVER</Text>
        <View style={styles.balanceTag}>
          <Text style={styles.balanceText}>₱ 150</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {/* Real Map Integration */}
        <MapTilerView center={[121.7270, 17.6186]} zoom={15} markers={currentMarker} />
        
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
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>₱480</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4.9⭐</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Incoming Booking Modal */}
      <Modal visible={showRequest} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.bookingCard}>
            <Text style={styles.newRequestTitle}>NEW RIDE REQUEST</Text>
            
            <View style={styles.passengerInfo}>
              <View style={styles.avatar}><Text>👤</Text></View>
              <View>
                <Text style={styles.pName}>John (Cash)</Text>
                <Text style={styles.pRating}>4.8 ⭐ User</Text>
              </View>
              <Text style={styles.estimatedFare}>₱ 50</Text>
            </View>

            <View style={styles.locations}>
              <Text style={styles.locLabel}>PICKUP</Text>
              <Text style={styles.locText}>SM City Tuguegarao</Text>
              <Text style={styles.locLabel}>DROPOFF</Text>
              <Text style={styles.locText}>Buntun Bridge</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => setShowRequest(false)}>
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => {
                setShowRequest(false);
                router.push("/driver/ride-status");
              }}>
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
    height: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, backgroundColor: "#fff", zIndex: 10,
    elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  menuButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F9FC", borderRadius: 20 },
  menuIcon: { fontSize: 20 },
  appTitle: { fontSize: 18, fontWeight: "800", color: "#2E3A59", letterSpacing: 1 },
  balanceTag: { backgroundColor: "#E3FFF1", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  balanceText: { color: "#00BA61", fontWeight: "bold" },
  
  mapContainer: { flex: 1, position: "relative" },
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

  locations: { backgroundColor: "#F7F9FC", padding: 16, borderRadius: 12, marginBottom: 24 },
  locLabel: { fontSize: 11, fontWeight: "bold", color: "#8E99B3", marginBottom: 4 },
  locText: { fontSize: 16, color: "#2E3A59", marginBottom: 12, fontWeight: "500" },
  
  actionRow: { flexDirection: "row", gap: 12 },
  rejectBtn: { flex: 1, height: 54, borderRadius: 12, borderWidth: 1, borderColor: "#FF3B30", justifyContent: "center", alignItems: "center" },
  rejectText: { color: "#FF3B30", fontSize: 16, fontWeight: "bold" },
  acceptBtn: { flex: 2, height: 54, borderRadius: 12, backgroundColor: "#00BA61", justifyContent: "center", alignItems: "center" },
  acceptText: { color: "#fff", fontSize: 16, fontWeight: "bold" }
});
