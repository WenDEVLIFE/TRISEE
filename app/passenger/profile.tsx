import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PassengerProfile() {
  const router = useRouter();
  const [name, setName] = useState("Juan Dela Cruz");
  const [phone, setPhone] = useState("09123456789");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.status}>Passenger</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace("/passenger/sign-in")}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
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
  backText: { fontSize: 22, color: "#2E3A59" },
  title: { fontSize: 18, fontWeight: "600", color: "#2E3A59" },
  
  scroll: { padding: 24 },
  
  avatarContainer: { alignItems: "center", marginBottom: 30 },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#FF5E3A",
    justifyContent: "center", alignItems: "center", marginBottom: 12
  },
  avatarLetter: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  name: { fontSize: 22, fontWeight: "bold", color: "#2E3A59" },
  status: { fontSize: 14, color: "#8E99B3", marginTop: 4 },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#8E99B3", marginBottom: 8 },
  input: {
    height: 50, backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "#EDF1F7", fontSize: 16, color: "#2E3A59"
  },

  saveButton: {
    backgroundColor: "#2E3A59", height: 50, borderRadius: 8,
    justifyContent: "center", alignItems: "center", marginTop: 20
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  
  logoutButton: {
    backgroundColor: "transparent", height: 50, borderRadius: 8, borderWidth: 1, borderColor: "#FF5E3A",
    justifyContent: "center", alignItems: "center", marginTop: 12
  },
  logoutButtonText: { color: "#FF5E3A", fontSize: 16, fontWeight: "bold" },
});
