import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";

type DriverProfile = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  nationality: string;
  pwd: string;
  idType: string;
};

const defaultProfile: DriverProfile = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  nationality: "",
  pwd: "",
  idType: "",
};

export default function DriverProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        if (isMounted) {
          setLoading(false);
          router.replace("/sign-in");
        }
        return;
      }

      try {
        const driverDoc = await getDoc(doc(db, "drivers", currentUser.uid));
        if (driverDoc.exists()) {
          const data = driverDoc.data() as Partial<DriverProfile>;
          if (isMounted) {
            setProfile({
              fullName: data.fullName || currentUser.displayName || "",
              email: data.email || currentUser.email || "",
              phone: data.phone || "",
              gender: data.gender || "",
              nationality: data.nationality || "",
              pwd: data.pwd || "",
              idType: data.idType || "",
            });
          }
        } else if (isMounted) {
          setProfile((prev) => ({
            ...prev,
            fullName: currentUser.displayName || "",
            email: currentUser.email || "",
          }));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load profile.";
        Alert.alert("Profile Error", message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const initials = useMemo(() => {
    if (!profile.fullName.trim()) return "D";
    return profile.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [profile.fullName]);

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Session Expired", "Please log in again.");
      router.replace("/sign-in");
      return;
    }

    if (!profile.fullName.trim() || !profile.phone.trim()) {
      Alert.alert("Incomplete", "Full name and phone are required.");
      return;
    }

    try {
      setSaving(true);
      await setDoc(
        doc(db, "drivers", currentUser.uid),
        {
          fullName: profile.fullName.trim(),
          phone: profile.phone.trim(),
          gender: profile.gender.trim(),
          nationality: profile.nationality.trim(),
          pwd: profile.pwd.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save profile.";
      Alert.alert("Save Failed", message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      router.replace("/sign-in");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log out.";
      Alert.alert("Logout Failed", message);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5E3A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.nameText}>{profile.fullName || "Driver"}</Text>
          <Text style={styles.roleText}>Driver Account</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={profile.fullName}
            onChangeText={(value) => setProfile((prev) => ({ ...prev, fullName: value }))}
            placeholder="Enter full name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={[styles.input, styles.readonlyInput]} value={profile.email} editable={false} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={profile.phone}
            onChangeText={(value) => setProfile((prev) => ({ ...prev, phone: value }))}
            placeholder="09XXXXXXXXX"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gender</Text>
          <TextInput
            style={styles.input}
            value={profile.gender}
            onChangeText={(value) => setProfile((prev) => ({ ...prev, gender: value }))}
            placeholder="Gender"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nationality</Text>
          <TextInput
            style={styles.input}
            value={profile.nationality}
            onChangeText={(value) => setProfile((prev) => ({ ...prev, nationality: value }))}
            placeholder="Nationality"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>PWD Status</Text>
          <TextInput
            style={styles.input}
            value={profile.pwd}
            onChangeText={(value) => setProfile((prev) => ({ ...prev, pwd: value }))}
            placeholder="NO / YES"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ID Type</Text>
          <TextInput style={[styles.input, styles.readonlyInput]} value={profile.idType || "Not uploaded"} editable={false} />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          disabled={saving || loggingOut}
          onPress={handleSave}
        >
          <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, (loggingOut || saving) && styles.buttonDisabled]}
          disabled={loggingOut || saving}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>{loggingOut ? "Logging out..." : "Logout"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5E3A",
    marginBottom: 10,
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  nameText: {
    color: "#2E3A59",
    fontSize: 22,
    fontWeight: "700",
  },
  roleText: {
    color: "#8E99B3",
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8E99B3",
    marginBottom: 7,
  },
  input: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#2E3A59",
  },
  readonlyInput: {
    backgroundColor: "#F2F4F7",
    color: "#6B7280",
  },
  primaryButton: {
    marginTop: 12,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#2E3A59",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  logoutButton: {
    marginTop: 10,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF5E3A",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#FF5E3A",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
