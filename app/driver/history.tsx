import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DriverRideHistory = {
  id: string;
  date: string;
  passenger: string;
  pickup: string;
  dropoff: string;
  fare: string;
  status: "Completed" | "Cancelled";
};

const DRIVER_RIDE_HISTORY: DriverRideHistory[] = [
  {
    id: "1",
    date: "Apr 04, 2026 - 10:20 AM",
    passenger: "Juan Dela Cruz",
    pickup: "SM City Tuguegarao",
    dropoff: "Buntun Bridge",
    fare: "₱50",
    status: "Completed",
  },
  {
    id: "2",
    date: "Apr 03, 2026 - 08:15 AM",
    passenger: "Maria Santos",
    pickup: "CSU Andrews",
    dropoff: "Centro 08",
    fare: "₱35",
    status: "Completed",
  },
  {
    id: "3",
    date: "Apr 02, 2026 - 06:40 PM",
    passenger: "Pedro Reyes",
    pickup: "Robinsons Place",
    dropoff: "Bagay Road",
    fare: "₱45",
    status: "Cancelled",
  },
];

export default function DriverHistory() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Ride History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {DRIVER_RIDE_HISTORY.map((ride) => (
          <View key={ride.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{ride.date}</Text>
              <Text
                style={[
                  styles.status,
                  ride.status === "Completed"
                    ? styles.statusCompleted
                    : styles.statusCancelled,
                ]}
              >
                {ride.status}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Passenger</Text>
              <Text style={styles.value}>{ride.passenger}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Pickup</Text>
              <Text style={styles.value}>{ride.pickup}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Drop-off</Text>
              <Text style={styles.value}>{ride.dropoff}</Text>
            </View>

            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Cash Collected</Text>
              <Text style={styles.earningsValue}>{ride.fare}</Text>
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
