import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapTilerView from "../../components/MapTilerView";

export default function PassengerHome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push("/passenger/profile")}>
          <Text style={styles.avatarIcon}>👤</Text>
        </TouchableOpacity>
        <Text style={styles.appTitle}>TRISEE</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push("/passenger/history")}>
          <Text style={styles.menuIcon}>📄</Text>
        </TouchableOpacity>
      </View>

      {/* Map Integration */}
      <View style={styles.mapContainer}>
        <MapTilerView center={[121.7270, 17.6186]} zoom={14} markers={[{ id: "p", lng: 121.7270, lat: 17.6186, emoji: "🧍" }]} />
      </View>

      {/* Bottom Sheet for Booking */}
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>Where to?</Text>
        
        <View style={styles.locationInputBox}>
          <View style={styles.dotLine}>
            <View style={[styles.dot, { backgroundColor: "#FF5E3A" }]} />
            <View style={styles.line} />
            <View style={[styles.square, { backgroundColor: "#2E3A59" }]} />
          </View>
          
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.mockInput}>
              <Text style={styles.mockInputText}>Current Location</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.mockInput}>
              <Text style={[styles.mockInputText, { color: "#8E99B3" }]}>Search destination</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.bookButton} 
          onPress={() => router.push("/passenger/ride-status")}
        >
          <Text style={styles.bookButtonText}>Find a Ride</Text>
        </TouchableOpacity>
      </View>
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
  appTitle: { fontSize: 20, fontWeight: "800", color: "#FF5E3A", letterSpacing: 1 },
  
  mapContainer: { flex: 1, position: "relative", backgroundColor: "#e8edea" },
  mapImage: { width: "100%", height: "100%", resizeMode: "cover", opacity: 0.7 },
  mockMarker: {
    position: "absolute", top: "50%", left: "40%", width: 36, height: 36,
    backgroundColor: "#fff", borderRadius: 18, justifyContent: "center", alignItems: "center",
    elevation: 5, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3
  },
  markerText: { fontSize: 18 },

  bottomSheet: {
    padding: 24, paddingBottom: 40, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8,
    marginTop: -20
  },
  sheetTitle: { fontSize: 22, fontWeight: "bold", color: "#2E3A59", marginBottom: 20 },
  
  locationInputBox: {
    flexDirection: "row", backgroundColor: "#F7F9FC", borderRadius: 12, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: "#EDF1F7"
  },
  dotLine: { width: 24, alignItems: "center", paddingTop: 8, paddingBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { flex: 1, width: 2, backgroundColor: "#EDF1F7", marginVertical: 4 },
  square: { width: 10, height: 10 },
  
  inputContainer: { flex: 1 },
  mockInput: { paddingVertical: 10, paddingHorizontal: 8 },
  mockInputText: { fontSize: 16, color: "#2E3A59", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#EDF1F7", marginVertical: 4 },

  bookButton: {
    backgroundColor: "#FF5E3A", height: 54, borderRadius: 12, justifyContent: "center", alignItems: "center"
  },
  bookButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
