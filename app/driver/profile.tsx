import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut, updateProfile as updateAuthProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db, storage } from "../../firebaseConfig";

type DriverProfile = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  nationality: string;
  pwd: string;
  idType: string;
  idFrontImage: string;
  idBackImage: string;
  profileImage: string;
};

const defaultProfile: DriverProfile = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  nationality: "",
  pwd: "",
  idType: "",
  idFrontImage: "",
  idBackImage: "",
  profileImage: "",
};

const idTypeOptions = [
  "Driver License",
  "National ID",
  "Passport",
  "SSS ID",
  "PhilHealth ID",
  "UMID",
  "Voter's ID",
];

const pwdStatusOptions = ["NO", "YES"];

export default function DriverProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingImageType, setUploadingImageType] = useState<
    "profile" | "idFront" | "idBack" | null
  >(null);
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"idType" | "pwd" | null>(
    null
  );

  const dropdownOptions = useMemo(() => {
    if (activeDropdown === "idType") return idTypeOptions;
    if (activeDropdown === "pwd") return pwdStatusOptions;
    return [];
  }, [activeDropdown]);

  const handleSelectDropdownValue = (value: string) => {
    if (activeDropdown === "idType") {
      setProfile((prev) => ({ ...prev, idType: value }));
    }

    if (activeDropdown === "pwd") {
      setProfile((prev) => ({ ...prev, pwd: value }));
    }

    setActiveDropdown(null);
  };

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
              idFrontImage: typeof (data as Record<string, unknown>).idFrontImage === "string"
                ? ((data as Record<string, unknown>).idFrontImage as string)
                : "",
              idBackImage: typeof (data as Record<string, unknown>).idBackImage === "string"
                ? ((data as Record<string, unknown>).idBackImage as string)
                : "",
              profileImage:
                typeof (data as Record<string, unknown>).profileImage === "string"
                  ? ((data as Record<string, unknown>).profileImage as string)
                  : currentUser.photoURL || "",
            });
            setAvatarImageFailed(false);
          }
        } else if (isMounted) {
          setProfile((prev) => ({
            ...prev,
            fullName: currentUser.displayName || "",
            email: currentUser.email || "",
            profileImage: currentUser.photoURL || "",
          }));
          setAvatarImageFailed(false);
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

  const uploadLocalFileToStorage = async (uri: string, storagePath: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, blob);
    return getDownloadURL(fileRef);
  };

  const pickAndUploadDriverImage = async (
    imageType: "profile" | "idFront" | "idBack",
    firestoreField: "profileImage" | "idFrontImage" | "idBackImage",
    storageName: string,
    successMessage: string
  ) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Session Expired", "Please log in again.");
      router.replace("/sign-in");
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission needed", "Please allow gallery access to update your ID picture.");
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

      setUploadingImageType(imageType);
      const uri = result.assets[0].uri;
      const uploadedUrl = await uploadLocalFileToStorage(
        uri,
        `drivers/${currentUser.uid}/${storageName}-${Date.now()}.jpg`
      );

      await setDoc(
        doc(db, "drivers", currentUser.uid),
        {
          [firestoreField]: uploadedUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (imageType === "profile") {
        await updateAuthProfile(currentUser, { photoURL: uploadedUrl });
      }

      setProfile((prev) => ({
        ...prev,
        [firestoreField]: uploadedUrl,
      }));

      if (imageType === "profile") {
        setAvatarImageFailed(false);
      }

      Alert.alert("Saved", successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload image.";
      Alert.alert("Upload Failed", message);
    } finally {
      setUploadingImageType(null);
    }
  };

  const handleEditProfilePicture = async () => {
    await pickAndUploadDriverImage(
      "profile",
      "profileImage",
      "profile",
      "Profile picture updated successfully."
    );
  };

  const handleEditIdFrontPicture = async () => {
    await pickAndUploadDriverImage(
      "idFront",
      "idFrontImage",
      "id-front",
      "ID front image updated successfully."
    );
  };

  const handleEditIdBackPicture = async () => {
    await pickAndUploadDriverImage(
      "idBack",
      "idBackImage",
      "id-back",
      "ID back image updated successfully."
    );
  };

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
          idType: profile.idType.trim(),
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
        <ActivityIndicator size="large" color="#005EFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {profile.profileImage && !avatarImageFailed ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={styles.avatarImage}
                onError={() => setAvatarImageFailed(true)}
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>
          <Text style={styles.nameText}>{profile.fullName || "Driver"}</Text>
          <Text style={styles.roleText}>Driver Account</Text>
          <TouchableOpacity
            style={[styles.secondaryButton, uploadingImageType === "profile" && styles.buttonDisabled]}
            disabled={uploadingImageType !== null || saving || loggingOut}
            onPress={handleEditProfilePicture}
          >
            <Text style={styles.secondaryButtonText}>
              {uploadingImageType === "profile" ? "Uploading..." : "Edit Profile Picture"}
            </Text>
          </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.dropdownField}
            onPress={() => setActiveDropdown("pwd")}
          >
            <Text
              style={
                profile.pwd ? styles.dropdownValueText : styles.dropdownPlaceholderText
              }
            >
              {profile.pwd || "Select PWD status"}
            </Text>
            <Text style={styles.dropdownCaret}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ID Front Picture</Text>
          <View style={styles.idImageBox}>
            {profile.idFrontImage ? (
              <Image source={{ uri: profile.idFrontImage }} style={styles.idImage} />
            ) : (
              <View style={styles.idImagePlaceholder}>
                <Text style={styles.idImagePlaceholderText}>No ID image uploaded</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.secondaryButton, uploadingImageType === "idFront" && styles.buttonDisabled]}
            disabled={uploadingImageType !== null || saving || loggingOut}
            onPress={handleEditIdFrontPicture}
          >
            <Text style={styles.secondaryButtonText}>
              {uploadingImageType === "idFront" ? "Uploading..." : "Edit ID Front"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ID Back Picture</Text>
          <View style={styles.idImageBox}>
            {profile.idBackImage ? (
              <Image source={{ uri: profile.idBackImage }} style={styles.idImage} />
            ) : (
              <View style={styles.idImagePlaceholder}>
                <Text style={styles.idImagePlaceholderText}>No ID back image uploaded</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.secondaryButton, uploadingImageType === "idBack" && styles.buttonDisabled]}
            disabled={uploadingImageType !== null || saving || loggingOut}
            onPress={handleEditIdBackPicture}
          >
            <Text style={styles.secondaryButtonText}>
              {uploadingImageType === "idBack" ? "Uploading..." : "Edit ID Back"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ID Type</Text>
          <TouchableOpacity
            style={styles.dropdownField}
            onPress={() => setActiveDropdown("idType")}
          >
            <Text
              style={
                profile.idType
                  ? styles.dropdownValueText
                  : styles.dropdownPlaceholderText
              }
            >
              {profile.idType || "Select ID type"}
            </Text>
            <Text style={styles.dropdownCaret}>▼</Text>
          </TouchableOpacity>
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

      <Modal
        visible={activeDropdown !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <Pressable
          style={styles.dropdownModalOverlay}
          onPress={() => setActiveDropdown(null)}
        >
          <View style={styles.dropdownModalBox}>
            <Text style={styles.dropdownModalTitle}>
              {activeDropdown === "idType" ? "Select ID Type" : "Select PWD Status"}
            </Text>

            {dropdownOptions.map((option) => {
              const isSelected =
                activeDropdown === "idType"
                  ? profile.idType === option
                  : profile.pwd === option;

              return (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownOptionRow}
                  onPress={() => handleSelectDropdownValue(option)}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      isSelected && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
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
    backgroundColor: "#005EFF",
    marginBottom: 10,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
  dropdownField: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownValueText: {
    fontSize: 15,
    color: "#2E3A59",
    fontWeight: "600",
  },
  dropdownPlaceholderText: {
    fontSize: 15,
    color: "#8E99B3",
    fontWeight: "500",
  },
  dropdownCaret: {
    fontSize: 12,
    color: "#6B7280",
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dropdownModalBox: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingVertical: 10,
    overflow: "hidden",
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E3A59",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownOptionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  dropdownOptionText: {
    fontSize: 15,
    color: "#2E3A59",
  },
  dropdownOptionTextSelected: {
    color: "#005EFF",
    fontWeight: "700",
  },
  readonlyInput: {
    backgroundColor: "#F2F4F7",
    color: "#6B7280",
  },
  idImageBox: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  idImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  idImagePlaceholder: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  idImagePlaceholderText: {
    color: "#8E99B3",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2E3A59",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#2E3A59",
    fontSize: 14,
    fontWeight: "700",
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
    borderColor: "#005EFF",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#005EFF",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
