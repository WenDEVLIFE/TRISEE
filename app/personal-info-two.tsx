import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebaseConfig";

export default function PersonalInfoTwo() {
  const router = useRouter();

  const [clearance, setClearance] = useState<"" | "Mayroon" | "Wala">("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [promiseChecked, setPromiseChecked] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isWala = clearance === "Wala";
  const isMayroon = clearance === "Mayroon";

  const canProceed = useMemo(() => {
    if (isWala) return promiseChecked;
    if (isMayroon) return !!uploadedImage;
    return false;
  }, [isWala, isMayroon, promiseChecked, uploadedImage]);

  const noteText =
    "Paalala:\nKung Police Clearance ang iyong ipinasa kailangan mo pa ring magsumite ng NBI Clearance sa loob ng 30 araw matapos ma-activate ang account.";

  const shortText =
    "Paalala: Kung Police Clearance ang iyong ipina...";

  React.useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem("personal-info-two");
        if (saved) {
          const data = JSON.parse(saved);
          setClearance(data.clearance || "");
          setPromiseChecked(data.promiseChecked || false);
          setUploadedImage(data.uploadedImage || null);
        }
      } catch (error) {
        console.log("Failed to load saved data");
      }
    };
    load();
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission to access gallery is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
    }
  };

  const handleNext = async () => {
    setTouched(true);

    if (!canProceed || isSaving) return;

    try {
      setIsSaving(true);

      const data = {
        clearance,
        promiseChecked,
        uploadedImage,
      };

      await AsyncStorage.setItem("personal-info-two", JSON.stringify(data));

      router.push("/personal-info-three");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Save failed.";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#111" />
            <View style={styles.redDot} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrap}>
            <Image
              source={require("../assets/images/driving-license.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>NBI / Police Clearance / CIBI</Text>

          <Text style={styles.label}>
            Mayroon ka bang NBI / Police Clearance / CIBI?
            <Text style={styles.required}> *</Text>
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.dropdown,
              dropdownVisible && styles.dropdownActive,
            ]}
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={[styles.dropdownText, !clearance && styles.placeholderText]}>
              {clearance || ""}
            </Text>

            <Ionicons name="chevron-down" size={22} color="#B8B8B8" />
          </TouchableOpacity>

          {isWala && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.8}
                onPress={() => setPromiseChecked(!promiseChecked)}
              >
                <View
                  style={[
                    styles.checkbox,
                    promiseChecked && styles.checkboxChecked,
                  ]}
                >
                  {promiseChecked && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>

                <Text style={styles.checkboxText}>
                  Nangangako ako na magsusumite ng kakulangang dokumento sa loob
                  ng 30 araw matapos ma-activate ang account.
                </Text>
              </TouchableOpacity>

              {touched && !promiseChecked && (
                <Text style={styles.errorText}>Required</Text>
              )}
            </View>
          )}

          {isMayroon && (
            <View style={styles.section}>
              <Text style={styles.uploadTitle}>
                Upload Clearance
                <Text style={styles.required}> *</Text>
              </Text>

              <View style={styles.uploadRow}>
                <View style={styles.uploadTextWrap}>
                  <Text style={styles.noteText}>
                    {expanded ? noteText : shortText}
                  </Text>

                  <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                    <Text style={styles.showMoreText}>
                      {expanded ? "Show less" : "Show more"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.uploadBox}
                  activeOpacity={0.8}
                  onPress={pickImage}
                >
                  {uploadedImage ? (
                    <Image
                      source={{ uri: uploadedImage }}
                      style={styles.uploadedPreview}
                    />
                  ) : (
                    <>
                      <Ionicons name="add" size={42} color="#111" />
                      <Text style={styles.uploadText}>Upload Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {touched && !uploadedImage && (
                <Text style={[styles.errorText, { marginTop: 10 }]}>Required</Text>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.nextButton, (!canProceed || isSaving) && styles.disabledButton]}
            activeOpacity={0.8}
            onPress={handleNext}
            disabled={!canProceed || isSaving}
          >
            <Text
              style={[styles.nextButtonText, (!canProceed || isSaving) && styles.disabledText]}
            >
              {isSaving ? "Saving..." : "Next"}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.modalCard}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setClearance("Mayroon");
                  setPromiseChecked(false);
                  setTouched(false);
                  setDropdownVisible(false);
                }}
              >
                <Text style={styles.optionText}>Mayroon</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setClearance("Wala");
                  setUploadedImage(null);
                  setTouched(false);
                  setDropdownVisible(false);
                }}
              >
                <Text style={styles.optionText}>Wala</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowMenu(false)}
          >
            <View style={styles.menuBox}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={async () => {
                  setShowMenu(false);
                  await signOut(auth);
                  router.replace("/sign-in");
                }}
              >
                <Text style={styles.optionText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F6F6",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    position: "absolute",
    top: 5,
    right: 3,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 28,
  },
  heroImage: {
    width: 220,
    height: 160,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
    marginBottom: 28,
  },
  label: {
    fontSize: 18,
    color: "#222",
    marginBottom: 12,
    lineHeight: 24,
  },
  required: {
    color: "#FF4D3D",
  },
  dropdown: {
    minHeight: 60,
    borderWidth: 1.4,
    borderColor: "#CFCFCF",
    borderRadius: 22,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownActive: {
    borderColor: "#005eff",
    borderWidth: 2,
  },
  dropdownText: {
    fontSize: 18,
    color: "#111",
  },
  placeholderText: {
    color: "#999",
  },
  section: {
    marginTop: 26,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.6,
    borderColor: "#C9C9C9",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: "#005eff",
    borderColor: "#005eff",
  },
  checkboxText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 32,
    color: "#111",
  },
  errorText: {
    color: "#E53935",
    fontSize: 16,
    marginTop: 10,
  },
  uploadTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
  },
  uploadRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  uploadTextWrap: {
    flex: 1,
    paddingRight: 6,
  },
  noteText: {
    fontSize: 17,
    lineHeight: 26,
    color: "#111",
  },
  showMoreText: {
    fontSize: 16,
    color: "#1265E6",
    marginTop: 8,
  },
  uploadBox: {
    width: 150,
    height: 150,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#C9C9C9",
    borderRadius: 22,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  uploadText: {
    marginTop: 10,
    fontSize: 16,
    color: "#777",
  },
  uploadedPreview: {
    width: "100%",
    height: "100%",
  },
  bottomButtons: {
    paddingBottom: 18,
    paddingTop: 12,
    backgroundColor: "#F6F6F6",
  },
  nextButton: {
    width: "100%",
    height: 60,
    borderRadius: 20,
    backgroundColor: "#005eff",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  disabledButton: {
    backgroundColor: "#EEEEEE",
  },
  disabledText: {
    color: "#BBBBBB",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  menuBox: {
    position: "absolute",
    top: 80,
    right: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    width: 160,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    paddingVertical: 6,
  },
  optionItem: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 16,
    marginHorizontal: 10,
    marginVertical: 4,
    backgroundColor: "#F5F5F5",
  },
  optionText: {
    fontSize: 18,
    color: "#111",
  },
});