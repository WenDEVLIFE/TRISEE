import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import { finalizeDriverRegistration } from "./service/registration";

export default function PersonalInfoThree() {
  const router = useRouter();

  const declarations = [
    "Ang aking driving license ay hindi pa nadi-disqualify o nasu-suspend.",
    "Ako ay hindi pa nahahatulan sa korte/hukuman.",
    "Hindi ako naghihintay para sa anumang uri ng paglilitis sa korte laban sa akin.",
    "Wala akong anumang medical condition para maging unfit sa pagmamaneho ng ligtas.",
    "Sumasang-ayon ako na gamitin ni Trisee ang aking personal data (kasama ang aking government ID, profile information at status para mag-conduct ng background checks, at mai-link ang aking personal data sa pagitan ng aking Trisee Driver App).",
  ];

  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    Array(declarations.length).fill(false)
  );
  const [isCreating, setIsCreating] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [philHealthId, setPhilHealthId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [userIdPicture, setUserIdPicture] = useState("");
  const [idType, setIdType] = useState("");

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem("driver-declaration-info");
        if (savedData) {
          const parsed = JSON.parse(savedData);

          if (
            Array.isArray(parsed.checkedItems) &&
            parsed.checkedItems.length === declarations.length
          ) {
            setCheckedItems(parsed.checkedItems);
          }
        }
      } catch {
        console.log("Failed to load saved data.");
      }
    };

    const fetchUser = async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      setCurrentUid(firebaseUser.uid);
      setPhotoUrl(firebaseUser.photoURL || "");

      const [driverSnap, userSnap] = await Promise.all([
        getDoc(doc(db, "drivers", firebaseUser.uid)),
        getDoc(doc(db, "users", firebaseUser.uid)),
      ]);

      if (driverSnap.exists()) {
        const driverData = driverSnap.data();
        setIdType(typeof driverData.idType === "string" ? driverData.idType : "");
        const idPicture =
          typeof driverData.idFrontImage === "string"
            ? driverData.idFrontImage
            : typeof driverData.idBackImage === "string"
              ? driverData.idBackImage
              : "";
        setUserIdPicture(idPicture);
      }

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setPhilHealthId(
          typeof userData.philHealthId === "string" ? userData.philHealthId : ""
        );
        if (!photoUrl && typeof userData.photoUrl === "string") {
          setPhotoUrl(userData.photoUrl);
        }
      }
    };

    loadSavedData();
    fetchUser();
  }, []);

  const allChecked = useMemo(
    () => checkedItems.every((item) => item),
    [checkedItems]
  );

  const toggleCheck = (index: number) => {
    const updated = [...checkedItems];
    updated[index] = !updated[index];
    setCheckedItems(updated);
  };

  const handleNext = async () => {
    if (!allChecked || isCreating) return;

    try {
      setIsCreating(true);

      await AsyncStorage.setItem(
        "driver-declaration-info",
        JSON.stringify({ checkedItems })
      );

      const uid = await AsyncStorage.getItem("driver-registration-uid");
      if (!uid) {
        Alert.alert(
          "Registration incomplete",
          "Unable to find the driver account ID. Please go back and finish the verification step again."
        );
        return;
      }

      await finalizeDriverRegistration(uid);

      router.replace("/home");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete driver registration.";
      console.error("[PersonalInfoThree] Driver finalize failed:", error);
      Alert.alert("Save failed", message);
    } finally {
      setIsCreating(false);
    }
  };

  const updateProfile = async () => {
    if (!currentUid) {
      Alert.alert("Not signed in", "Please sign in again and retry.");
      return;
    }

    await Promise.all([
      updateDoc(doc(db, "users", currentUid), {
        photoUrl,
        philHealthId,
      }),
      updateDoc(doc(db, "drivers", currentUid), {
        idType,
      }),
    ]);

    Alert.alert("Success", "Profile updated successfully.");
  };

  const changePasswordHandler = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      Alert.alert("Not signed in", "Please sign in again and retry.");
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert("Missing password", "Please enter a new password.");
      return;
    }

    await updatePassword(firebaseUser, newPassword.trim());
    setNewPassword("");
    Alert.alert("Success", "Password changed successfully.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Declarations</Text>

        <Text style={styles.subtitle}>
          Please review each statement carefully and confirm your agreement
          before proceeding.
        </Text>

        <View style={styles.card}>
          {declarations.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.declarationRow,
                index !== declarations.length - 1 && styles.declarationDivider,
              ]}
              activeOpacity={0.85}
              onPress={() => toggleCheck(index)}
            >
              <View
                style={[
                  styles.checkbox,
                  checkedItems[index] && styles.checkboxChecked,
                ]}
              >
                {checkedItems[index] && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>

              <Text style={styles.declarationText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.title}>Edit Profile</Text>

        <Text style={styles.subtitle}>
          View your uploaded ID picture and edit your ID type. You can also
          update profile details and password.
        </Text>

        <View style={styles.card}>
          <Text>Edit Photo URL:</Text>
          <TextInput
            style={styles.input}
            value={photoUrl}
            onChangeText={setPhotoUrl}
            placeholder="Enter Photo URL"
          />
          <Text>Edit PhilHealth ID:</Text>
          <TextInput
            style={styles.input}
            value={philHealthId}
            onChangeText={setPhilHealthId}
            placeholder="Enter PhilHealth ID"
          />
          <Button title="Update Profile" onPress={updateProfile} />
          <Text>Change Password:</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter New Password"
            secureTextEntry
          />
          <Button title="Change Password" onPress={changePasswordHandler} />
          <Text>Edit ID Type:</Text>
          <TextInput
            style={styles.input}
            value={idType}
            onChangeText={setIdType}
            placeholder="Enter ID Type"
          />
          <Text>User ID Picture:</Text>
          <Image
            source={{ uri: userIdPicture }}
            style={{ width: 100, height: 100 }}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[
            styles.bottomButton,
            styles.nextButton,
            (!allChecked || isCreating) && styles.disabledButton,
          ]}
          disabled={!allChecked || isCreating}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          {isCreating ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.nextButtonText}>Creating...</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.nextButtonText,
                !allChecked && styles.disabledText,
              ]}
            >
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 20,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  scrollContent: {
    paddingBottom: 24,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111",
    marginBottom: 10,
    letterSpacing: 0.2,
    margin: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "#6B7280",
    marginBottom: 20,
    margin: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  declarationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 18,
  },

  declarationDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.8,
    borderColor: "#CFCFCF",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    marginTop: 3,
  },

  checkboxChecked: {
    borderColor: "#005EFF",
    backgroundColor: "#005EFF",
  },

  declarationText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 30,
    color: "#111827",
  },

  bottomButtons: {
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: "#F7F8FA",
  },

  bottomButton: {
    width: "90%",
    alignSelf: "center",
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  nextButton: {
    backgroundColor: "#005EFF",
  },

  nextButtonText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginLeft: 8,
  },

  disabledButton: {
    backgroundColor: "#EDEDED",
  },

  disabledText: {
    color: "#BDBDBD",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    height: 40,
    borderColor: "#CFCFCF",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
});