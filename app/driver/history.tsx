import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../firebaseConfig";
import { subscribeDriverRideHistory, type RideListenerResult } from "../service/ride";

export default function DriverHistory() {
  const [history, setHistory] = useState<RideListenerResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeDriverRideHistory(currentUser.uid, (rides) => {
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
        <Text style={styles.title}>Driver Ride History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {history.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No driver history yet</Text>
            <Text style={styles.emptyText}>Completed and cancelled trips will appear here.</Text>
          </View>
        ) : history.map((ride) => (
          <View key={ride.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>Ride #{ride.rideId.slice(0, 6)}</Text>
              <Text
                style={[
                  styles.status,
                  ride.status === "completed"
                    ? styles.statusCompleted
                    : styles.statusCancelled,
                ]}
              >
                {ride.status}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Passenger</Text>
              <Text style={styles.value}>{ride.passengerName}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Pickup</Text>
              <Text style={styles.value}>{ride.pickupLocation}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Drop-off</Text>
              <Text style={styles.value}>{ride.dropoffLocation}</Text>
            </View>

            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Cash Collected</Text>
              <Text style={styles.earningsValue}>₱{ride.fareAmount}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  header: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1F7",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E3A59",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F9FC" },
  emptyBox: { backgroundColor: "#fff", borderRadius: 14, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#EDF1F7" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#2E3A59", marginBottom: 6 },
  emptyText: { fontSize: 14, color: "#8E99B3", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EDF1F7",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  date: {
    color: "#8E99B3",
    fontSize: 13,
    fontWeight: "600",
  },
  status: {
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: "#E3FFF1",
    color: "#00BA61",
  },
  statusCancelled: {
    backgroundColor: "#FFE5E5",
    color: "#FF3B30",
  },
  row: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "#8E99B3",
    fontWeight: "600",
  },
  value: {
    marginTop: 2,
    fontSize: 15,
    color: "#2E3A59",
    fontWeight: "600",
  },
  earningsRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EDF1F7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningsLabel: {
    fontSize: 13,
    color: "#8E99B3",
    fontWeight: "700",
  },
  earningsValue: {
    fontSize: 18,
    color: "#00BA61",
    fontWeight: "800",
  },
});
