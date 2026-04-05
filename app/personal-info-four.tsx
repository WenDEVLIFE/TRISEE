import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";

export default function PersonalInfoFour() {
  const router = useRouter();

  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    Array(7).fill(false)
  );
  const [menuVisible, setMenuVisible] = useState(false);

  const declarations = useMemo(
    () => [
      "Ang aking driving license ay hindi pa nadi-disqualify o nasu-suspend.",
      "Ako ay hindi pa nahahatulan sa korte/hukuman.",
      "Hindi ako naghihintay para sa anumang uri ng paglilitis sa korte laban sa akin.",
      "Wala akong anumang medical condition para maging unfit sa pagmamaneho ng ligtas.",
      "Sumasang-ayon ako na mag top-up (o magdadagdag) at mag clawback (o magdededuct) si Grab sa aking cash wallet at credit wallet para sa kahit anong Grab-related transactions.",
      "Sumasang-ayon ako na gamitin ni Grab ang aking personal data (kasama ang aking government ID, profile information at status para: Mag-offer ng financial products at services, mag-conduct ng background checks, mai-link ang aking personal data sa pagitan ng aking Grab Driver App at Grab customer App (kung mayroon ako) at maisagawa ang mga reasonable na bagay base sa nakasaad sa privacy policy ng Grab.",
      "Naiintindihan ko na sa pag-upgrade ng aking Driver Cash Wallet, nili-link ito sa GrabPay Wallet ng aking Grab Customer App. Kung wala akong Grab Pay Wallet, maaaring kailanganan kong mag-sign up para makakuha nito.",
    ],
    []
  );

  const allChecked = checkedItems.every(Boolean);

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const handleCreate = () => {
    if (!allChecked) {
      Alert.alert("Required", "Please check all required declarations first.");
      return;
    }

    router.push("/home");
  };

  const handleSignOut = async () => {
    try {
      setMenuVisible(false);
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Failed to sign out.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.menuButton}
        >
          <Text style={styles.menuDots}>⋮</Text>
          <View style={styles.redDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>Declarations</Text>

        {declarations.map((item, index) => {
          const checked = checkedItems[index];

          return (
            <View key={index} style={styles.itemBlock}>
              <TouchableOpacity
                style={styles.itemRow}
                activeOpacity={0.8}
                onPress={() => toggleItem(index)}
              >
                <View
                  style={[
                    styles.checkbox,
                    checked ? styles.checkboxChecked : styles.checkboxUnchecked,
                  ]}
                >
                  {checked && <Text style={styles.checkMark}>✓</Text>}
                </View>

                <Text style={styles.itemText}>{item}</Text>
              </TouchableOpacity>

              {!checked && <Text style={styles.requiredText}>Required</Text>}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.saveButton} activeOpacity={1}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.createButton,
            allChecked ? styles.createButtonActive : styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.createButtonText,
              allChecked
                ? styles.createButtonTextActive
                : styles.createButtonTextDisabled,
            ]}
          >
            Create
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleSignOut}
            >
              <Text style={styles.dropdownItemText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const BLUE = "#0F2286";
const LIGHT_BLUE = "#EAF1FF";
const BORDER = "#D9D9D9";
const TEXT = "#111111";
const MUTED = "#BDBDBD";
const RED = "#E53935";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  backArrow: {
    fontSize: 34,
    color: TEXT,
    lineHeight: 34,
  },

  menuButton: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  menuDots: {
    fontSize: 24,
    color: TEXT,
    lineHeight: 24,
  },

  redDot: {
    position: "absolute",
    top: 4,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#000",
    marginBottom: 28,
  },

  itemBlock: {
    marginBottom: 18,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  checkbox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 14,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },

  checkboxUnchecked: {
    borderColor: BORDER,
    backgroundColor: "#FFF",
  },

  checkboxChecked: {
    borderColor: BLUE,
    backgroundColor: BLUE,
  },

  checkMark: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 24,
  },

  itemText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 28,
    color: TEXT,
    fontWeight: "400",
  },

  requiredText: {
    color: RED,
    fontSize: 15,
    marginTop: 8,
    marginLeft: 54,
  },

  bottomButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: "#F7F7F7",
    gap: 14,
  },

  saveButton: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#B9B9B9",
  },

  createButton: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
  },

  createButtonDisabled: {
    backgroundColor: "#D9E2FF",
  },

  createButtonActive: {
    backgroundColor: BLUE,
  },

  createButtonText: {
    fontSize: 19,
    fontWeight: "800",
  },

  createButtonTextDisabled: {
    color: "#FFFFFF",
    opacity: 0.85,
  },

  createButtonTextActive: {
    color: "#FFFFFF",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  dropdownMenu: {
    position: "absolute",
    top: 70,
    right: 20,
    width: 140,
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },

  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  dropdownItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT,
  },
});