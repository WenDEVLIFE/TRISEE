import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PassengerRating() {
  const router = useRouter();
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    // Navigate back to home after rating
    router.replace("/passenger/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeEmoji}>✅</Text>
        </View>
        <Text style={styles.title}>You arrived!</Text>
        <Text style={styles.subtitle}>How was your ride with Mario?</Text>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={[styles.star, rating >= star ? styles.starFilled : styles.starEmpty]}>
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.textArea}
          placeholder="Leave a comment (Optional)"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={{ flex: 1 }} />

        <TouchableOpacity 
          style={[styles.submitButton, rating === 0 && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={rating === 0}
        >
          <Text style={styles.submitButtonText}>Submit Rating</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSubmit}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 24, alignItems: "center", paddingTop: 60 },
  
  badge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#E3FFF1",
    justifyContent: "center", alignItems: "center", marginBottom: 24
  },
  badgeEmoji: { fontSize: 40 },
  
  title: { fontSize: 28, fontWeight: "bold", color: "#2E3A59", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#8E99B3", marginBottom: 40, textAlign: "center" },

  starsContainer: { flexDirection: "row", gap: 8, marginBottom: 30 },
  star: { fontSize: 48 },
  starFilled: { color: "#FFD700" },
  starEmpty: { color: "#EDF1F7" },

  textArea: {
    width: "100%", height: 100, backgroundColor: "#F7F9FC",
    borderWidth: 1, borderColor: "#EDF1F7", borderRadius: 12,
    padding: 16, fontSize: 16, color: "#2E3A59"
  },

  submitButton: {
    width: "100%", height: 54, backgroundColor: "#FF5E3A", borderRadius: 12,
    justifyContent: "center", alignItems: "center", marginBottom: 16
  },
  disabledButton: { backgroundColor: "#FFD4CC" },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  
  skipButton: { width: "100%", height: 54, justifyContent: "center", alignItems: "center" },
  skipButtonText: { color: "#8E99B3", fontSize: 16, fontWeight: "600" },
});
