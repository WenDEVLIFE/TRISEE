import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock Data
const RIDE_HISTORY = [
  { id: "1", date: "Oct 24, 2026 - 10:30 AM", dropoff: "SM City Tuguegarao", price: "₱50", status: "Completed" },
  { id: "2", date: "Oct 22, 2026 - 08:15 AM", dropoff: "Cagayan State University", price: "₱30", status: "Completed" },
  { id: "3", date: "Oct 20, 2026 - 05:40 PM", dropoff: "Buntun Bridge", price: "₱40", status: "Cancelled" },
];

export default function PassengerHistory() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ride History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {RIDE_HISTORY.map((ride) => (
          <View key={ride.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{ride.date}</Text>
              <Text style={[
                styles.status, 
                ride.status === "Cancelled" ? styles.statusCancelled : styles.statusCompleted
              ]}>
                {ride.status}
              </Text>
            </View>
            
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Drop-off</Text>
                <Text style={styles.location}>{ride.dropoff}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.label}>Fare (Cash)</Text>
                <Text style={styles.price}>{ride.price}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F9FC" },
  header: {
    height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#EDF1F7"
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  backText: { fontSize: 24, color: "#2E3A59" },
  title: { fontSize: 18, fontWeight: "600", color: "#2E3A59" },

  scroll: { padding: 16 },

  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: "#EDF1F7", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  date: { fontSize: 14, color: "#8E99B3", fontWeight: "500" },
  status: { fontSize: 12, fontWeight: "bold", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusCompleted: { backgroundColor: "#E3FFF1", color: "#00BA61" },
  statusCancelled: { backgroundColor: "#FFE5E5", color: "#FF3B30" },

  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 12, color: "#8E99B3", marginBottom: 4 },
  location: { fontSize: 16, fontWeight: "600", color: "#2E3A59" },
  price: { fontSize: 16, fontWeight: "bold", color: "#FF5E3A" },
});
