import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut, updatePassword, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db, storage } from "../../firebaseConfig";

export default function PassengerProfile() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasValidProfileImage = profileImage.trim().length > 0 && !avatarImageFailed;

  useEffect(() => {
    const loadProfile = async () => {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        setIsLoading(false);
        Alert.alert("Session expired", "Please sign in again.");
        router.replace("/sign-in");
        return;
      }

      try {
        setEmail(firebaseUser.email || "");
        setName(firebaseUser.displayName || "");
        setProfileImage(firebaseUser.photoURL || "");

        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(typeof data.fullName === "string" ? data.fullName : firebaseUser.displayName || "");
          setPhone(typeof data.phone === "string" ? data.phone : "");
          setEmail(typeof data.email === "string" ? data.email : firebaseUser.email || "");
          setProfileImage(
            typeof data.profileImage === "string" ? data.profileImage : firebaseUser.photoURL || ""
          );
          setAvatarImageFailed(false);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load profile.";
        Alert.alert("Error", message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSaveChanges = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      Alert.alert("Session expired", "Please sign in again.");
      router.replace("/sign-in");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Missing name", "Full name is required.");
      return;
    }

    try {
      setIsSaving(true);

      await updateProfile(firebaseUser, {
        displayName: name.trim(),
      });

      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          uid: firebaseUser.uid,
          fullName: name.trim(),
          phone: phone.trim(),
          email: email.trim() || firebaseUser.email || "",
          profileImage: profileImage || firebaseUser.photoURL || "",
          role: "user",
          userType: "passenger",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update profile.";
      Alert.alert("Update failed", message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadLocalFileToStorage = async (uri: string, storagePath: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, blob);
    return getDownloadURL(fileRef);
  };

  const handleChangeProfilePicture = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      Alert.alert("Session expired", "Please sign in again.");
      router.replace("/sign-in");
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission needed", "Please allow gallery access to change your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      setIsUploadingImage(true);
      const uploadedUrl = await uploadLocalFileToStorage(
        result.assets[0].uri,
        `users/${firebaseUser.uid}/profile-${Date.now()}.jpg`
      );

      await updateProfile(firebaseUser, { photoURL: uploadedUrl });

      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          profileImage: uploadedUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setProfileImage(uploadedUrl);
      setAvatarImageFailed(false);
      Alert.alert("Success", "Profile picture updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to change profile picture.";
      Alert.alert("Upload failed", message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleChangePassword = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      Alert.alert("Session expired", "Please sign in again.");
      router.replace("/sign-in");
      return;
    }

    if (newPassword.trim().length < 6) {
      Alert.alert("Weak password", "New password must be at least 6 characters.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await updatePassword(firebaseUser, newPassword.trim());
      setNewPassword("");
      Alert.alert("Success", "Password changed successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to change password.";
      Alert.alert("Password change failed", message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/sign-in");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log out.";
      Alert.alert("Logout failed", message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#005EFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            {hasValidProfileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImage}
                onError={() => setAvatarImageFailed(true)}
              />
            ) : (
              <Text style={styles.avatarLetter}>{(name.trim().charAt(0) || "U").toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.status}>Passenger</Text>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.avatarButton, isUploadingImage && styles.buttonDisabled]}
            onPress={handleChangeProfilePicture}
            disabled={isUploadingImage || isSaving || isChangingPassword}
          >
            <Text style={styles.secondaryButtonText}>
              {isUploadingImage ? "Uploading..." : "Change Profile Picture"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={[styles.input, styles.readOnlyInput]} value={email} editable={false} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Enter new password"
          />
          <TouchableOpacity
            style={[styles.secondaryButton, isChangingPassword && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={isChangingPassword}
          >
            <Text style={styles.secondaryButtonText}>
              {isChangingPassword ? "Changing Password..." : "Change Password"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSaveChanges}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F9FC" },
  container: { flex: 1, backgroundColor: "#F7F9FC" },
  
  scroll: { padding: 24 },
  
  avatarContainer: { alignItems: "center", marginBottom: 30 },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#005EFF",
    justifyContent: "center", alignItems: "center", marginBottom: 12, overflow: "hidden"
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarLetter: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  name: { fontSize: 22, fontWeight: "bold", color: "#2E3A59" },
  status: { fontSize: 14, color: "#8E99B3", marginTop: 4 },
  avatarButton: { marginTop: 12, minWidth: 220 },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#8E99B3", marginBottom: 8 },
  input: {
    height: 50, backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "#EDF1F7", fontSize: 16, color: "#2E3A59"
  },
  readOnlyInput: { backgroundColor: "#F2F4F8", color: "#8E99B3" },
  secondaryButton: {
    backgroundColor: "#fff", height: 46, borderRadius: 8,
    justifyContent: "center", alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: "#2E3A59"
  },
  secondaryButtonText: { color: "#2E3A59", fontSize: 15, fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },

  saveButton: {
    backgroundColor: "#2E3A59", height: 50, borderRadius: 8,
    justifyContent: "center", alignItems: "center", marginTop: 20
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  
  logoutButton: {
    backgroundColor: "transparent", height: 50, borderRadius: 8, borderWidth: 1, borderColor: "#005EFF",
    justifyContent: "center", alignItems: "center", marginTop: 12
  },
  logoutButtonText: { color: "#005EFF", fontSize: 16, fontWeight: "bold" },
});
