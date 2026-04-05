import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../firebaseConfig";
import { subscribePassengerRideHistory, type RideListenerResult } from "../service/ride";

export default function PassengerHistory() {
  const router = useRouter();
  const [history, setHistory] = useState<RideListenerResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribePassengerRideHistory(currentUser.uid, (rides) => {
      setHistory(rides);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        <Text style={styles.title}>Ride History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {history.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No ride history yet</Text>
            <Text style={styles.emptyText}>Your completed rides will appear here after booking.</Text>
          </View>
        ) : history.map((ride) => (
          <View key={ride.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>Ride #{ride.rideId.slice(0, 6)}</Text>
              <Text style={[
                styles.status, 
                ride.status === "cancelled" ? styles.statusCancelled : styles.statusCompleted
              ]}>
                {ride.status}
              </Text>
            </View>
            
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Drop-off</Text>
                <Text style={styles.location}>{ride.dropoffLocation}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.label}>Fare (Cash)</Text>
                <Text style={styles.price}>₱{ride.fareAmount}</Text>
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
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F9FC" },
  emptyBox: { backgroundColor: "#fff", borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#EDF1F7" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#2E3A59", marginBottom: 6 },
  emptyText: { fontSize: 14, color: "#8E99B3", textAlign: "center" },

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
  price: { fontSize: 16, fontWeight: "bold", color: "#005EFF" },
});
