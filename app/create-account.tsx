import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import * as React from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";

const CreateAccount = () => {
  const router = useRouter();

  const [contactName, setContactName] = React.useState("");
  const [relationship, setRelationship] = React.useState("");
  const [contactNumber, setContactNumber] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [showRelationshipModal, setShowRelationshipModal] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem("create-account-emergency-contact");

        if (saved) {
          const data = JSON.parse(saved);
          setContactName(data.contactName || "");
          setRelationship(data.relationship || "");
          setContactNumber(data.contactNumber || "");
          setAddress(data.address || "");
          setIsSaved(true);
        }
      } catch (error) {
        console.log("Failed to load data");
      }
    };

    loadData();
  }, []);

  const relationshipOptions = ["Mother", "Father", "Sibling", "Other"];

  const addressOptions = [
    "Bagay, Tuguegarao City, Cagayan",
    "Buntun, Tuguegarao City, Cagayan",
    "Carig Sur, Tuguegarao City, Cagayan",
    "Carig Norte, Tuguegarao City, Cagayan",
    "Cataggaman Nuevo, Tuguegarao City, Cagayan",
    "Cataggaman Pardo, Tuguegarao City, Cagayan",
    "Centro 1, Tuguegarao City, Cagayan",
    "Centro 2, Tuguegarao City, Cagayan",
    "Centro 3, Tuguegarao City, Cagayan",
    "Centro 4, Tuguegarao City, Cagayan",
    "Centro 5, Tuguegarao City, Cagayan",
    "Centro 6, Tuguegarao City, Cagayan",
    "Centro 7, Tuguegarao City, Cagayan",
    "Centro 8, Tuguegarao City, Cagayan",
    "Centro 9, Tuguegarao City, Cagayan",
    "Centro 10, Tuguegarao City, Cagayan",
    "Centro 11, Tuguegarao City, Cagayan",
    "Centro 12, Tuguegarao City, Cagayan",
    "Centro 13, Tuguegarao City, Cagayan",
    "Centro 14, Tuguegarao City, Cagayan",
    "Centro 15, Tuguegarao City, Cagayan",
    "Centro 16, Tuguegarao City, Cagayan",
    "Centro 17, Tuguegarao City, Cagayan",
    "Centro 18, Tuguegarao City, Cagayan",
    "Centro 19, Tuguegarao City, Cagayan",
    "Centro 20, Tuguegarao City, Cagayan",
    "Centro 21, Tuguegarao City, Cagayan",
    "Centro 22, Tuguegarao City, Cagayan",
    "Centro 23, Tuguegarao City, Cagayan",
    "Centro 24, Tuguegarao City, Cagayan",
    "Centro 25, Tuguegarao City, Cagayan",
    "Centro 26, Tuguegarao City, Cagayan",
    "Centro 27, Tuguegarao City, Cagayan",
    "Centro 28, Tuguegarao City, Cagayan",
    "Centro 29, Tuguegarao City, Cagayan",
    "Centro 30, Tuguegarao City, Cagayan",
    "Centro 31, Tuguegarao City, Cagayan",
    "Centro 32, Tuguegarao City, Cagayan",
    "Centro 33, Tuguegarao City, Cagayan",
    "Centro 34, Tuguegarao City, Cagayan",
    "Centro 35, Tuguegarao City, Cagayan",
    "Centro 36, Tuguegarao City, Cagayan",
    "Centro 37, Tuguegarao City, Cagayan",
    "Centro 38, Tuguegarao City, Cagayan",
    "Centro 39, Tuguegarao City, Cagayan",
    "Centro 40, Tuguegarao City, Cagayan",
    "Centro 41, Tuguegarao City, Cagayan",
    "Centro 42, Tuguegarao City, Cagayan",
    "Centro 43, Tuguegarao City, Cagayan",
    "Centro 44, Tuguegarao City, Cagayan",
    "Centro 45, Tuguegarao City, Cagayan",
    "Centro 46, Tuguegarao City, Cagayan",
    "Centro 47, Tuguegarao City, Cagayan",
    "Centro 48, Tuguegarao City, Cagayan",
    "Centro 49, Tuguegarao City, Cagayan",
    "Centro 50, Tuguegarao City, Cagayan",
    "Centro 51, Tuguegarao City, Cagayan",
    "Pengue-Ruyu, Tuguegarao City, Cagayan",
    "Tanza, Tuguegarao City, Cagayan",
    "Ugac Norte, Tuguegarao City, Cagayan",
    "Ugac Sur, Tuguegarao City, Cagayan",
  ];

  const filteredAddresses = React.useMemo(() => {
    if (!address.trim()) return addressOptions;
    return addressOptions.filter((item) =>
      item.toLowerCase().includes(address.toLowerCase())
    );
  }, [address]);

  const isContactNameValid = contactName.trim().length > 0;
  const isRelationshipValid = relationship.trim().length > 0;
  const isContactNumberValid = /^[0-9]{10}$/.test(contactNumber.trim());
  const isAddressValid = address.trim().length > 0;

  const isFormFilled =
    isContactNameValid &&
    isRelationshipValid &&
    isContactNumberValid &&
    isAddressValid;

  const handleNext = async () => {
    setTouched(true);

    if (!isFormFilled || isSaving) return;

    try {
      setIsSaving(true);

      await AsyncStorage.setItem(
        "create-account-emergency-contact",
        JSON.stringify({
          contactName: contactName.trim(),
          relationship: relationship.trim(),
          contactNumber: contactNumber.trim(),
          address: address.trim(),
        })
      );

      setIsSaved(true);
      router.push("/personal-info");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Save failed", error.message);
      } else {
        Alert.alert("Save failed", "Something went wrong.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.rightTop}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
          >
            <Text style={styles.menuText}>⋮</Text>
            <View style={styles.redDot} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={120}
        enableOnAndroid={true}
      >
        <Image
          source={require("../assets/images/emergency-contact.png")}
          style={styles.topImage}
          resizeMode="contain"
        />

        <Text style={styles.title}>Emergency Contact</Text>

        <Text style={styles.label}>
          Emergency Contact Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            touched && !isContactNameValid && styles.inputError,
          ]}
          placeholder="Emergency Contact Name"
          placeholderTextColor="#bdbdbd"
          value={contactName}
          onChangeText={setContactName}
        />
        {touched && !isContactNameValid && (
          <Text style={styles.errorText}>Required</Text>
        )}

        <Text style={styles.label}>
          Relationship <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdown,
            touched && !isRelationshipValid && styles.inputError,
          ]}
          onPress={() => setShowRelationshipModal(true)}
        >
          <Text
            style={[
              styles.dropdownText,
              !relationship && styles.placeholderText,
            ]}
          >
            {relationship || "Relationship"}
          </Text>
          <Text style={styles.dropdownArrow}>⌄</Text>
        </TouchableOpacity>
        {touched && !isRelationshipValid && (
          <Text style={styles.errorText}>Required</Text>
        )}

        <Text style={styles.label}>
          Emergency Contact Number <Text style={styles.required}>*</Text>
        </Text>
        <View
          style={[
            styles.phoneRow,
            touched && !isContactNumberValid && styles.inputError,
          ]}
        >
          <View style={styles.countryCodeBox}>
            <Text style={styles.countryCodeText}>+63</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="Emergency Contact Number"
            placeholderTextColor="#bdbdbd"
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, "").slice(0, 10);
              setContactNumber(cleaned);
            }}
            maxLength={10}
          />
        </View>
        {touched && !isContactNumberValid && (
          <Text style={styles.errorText}>Enter 10 digits</Text>
        )}

        <Text style={styles.label}>
          Address <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.addressWrap}>
          <TextInput
            style={[
              styles.input,
              styles.addressInput,
              touched && !isAddressValid && styles.inputError,
            ]}
            placeholder="Type and search address"
            placeholderTextColor="#bdbdbd"
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              setShowAddressDropdown(true);
            }}
            onFocus={() => setShowAddressDropdown(true)}
          />

          {showAddressDropdown && (
            <View style={styles.addressDropdown}>
              <KeyboardAwareScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={styles.addressDropdownScroll}
              >
                {filteredAddresses.length > 0 ? (
                  filteredAddresses.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.addressOption}
                      onPress={() => {
                        setAddress(item);
                        setShowAddressDropdown(false);
                      }}
                    >
                      <Text style={styles.addressOptionText}>{item}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.addressOption}>
                    <Text style={styles.noResultText}>No address found</Text>
                  </View>
                )}
              </KeyboardAwareScrollView>
            </View>
          )}
        </View>
        {touched && !isAddressValid && (
          <Text style={styles.errorText}>Required</Text>
        )}
      </KeyboardAwareScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[
            styles.bottomButton,
            isFormFilled ? styles.activeButton : styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={!isFormFilled || isSaving}
        >
          <Text
            style={[
              styles.bottomButtonText,
              !isFormFilled && styles.disabledText,
            ]}
          >
            {isSaving ? "Saving..." : "Next"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showRelationshipModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRelationshipModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowRelationshipModal(false)}
        >
          <View style={styles.modalBox}>
            {relationshipOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.optionItem}
                onPress={() => {
                  setRelationship(item);
                  setShowRelationshipModal(false);
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            ))}
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
              <Text style={styles.optionText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default CreateAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  backText: {
    fontSize: 28,
    color: "#111",
  },

  rightTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuButton: {
    width: 28,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  menuText: {
    fontSize: 24,
    color: "#111",
  },

  redDot: {
    position: "absolute",
    top: 7,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 30,
  },

  topImage: {
    width: 180,
    height: 180,
    alignSelf: "center",
    marginTop: 0,
    marginBottom: 0,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000",
    marginBottom: 10,
  },

  label: {
    fontSize: 17,
    color: "#222",
    marginBottom: 12,
    fontWeight: "500",
  },

  required: {
    color: "red",
  },

  input: {
    height: 45,
    borderWidth: 1.5,
    borderColor: "#cfcfcf",
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#111",
    marginBottom: 20,
  },

  addressWrap: {
    position: "relative",
    zIndex: 999,
    marginBottom: 20,
  },

  addressInput: {
    marginBottom: 0,
  },

  addressDropdown: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#cfcfcf",
    borderRadius: 16,
    maxHeight: 180,
    overflow: "hidden",
  },

  addressDropdownScroll: {
    maxHeight: 180,
  },

  addressOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  addressOptionText: {
    fontSize: 15,
    color: "#111",
  },

  noResultText: {
    fontSize: 15,
    color: "#999",
  },

  dropdown: {
    height: 45,
    borderWidth: 1.5,
    borderColor: "#cfcfcf",
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownText: {
    fontSize: 18,
    color: "#111",
  },

  placeholderText: {
    color: "#bdbdbd",
  },

  dropdownArrow: {
    fontSize: 24,
    color: "#9d9d9d",
  },

  phoneRow: {
    flexDirection: "row",
    height: 45,
    borderWidth: 1.5,
    borderColor: "#cfcfcf",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 20,
  },

  countryCodeBox: {
    width: 88,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1.5,
    borderRightColor: "#d4d4d4",
    backgroundColor: "#fff",
  },

  countryCodeText: {
    fontSize: 18,
    color: "#bdbdbd",
  },

  phoneInput: {
    flex: 1,
    paddingHorizontal: 20,
    fontSize: 18,
    color: "#111",
  },

  inputError: {
    borderColor: "#E53935",
  },

  errorText: {
    color: "#E53935",
    fontSize: 14,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },

  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingBottom: 18,
    paddingTop: 12,
    backgroundColor: "#f6f6f6",
    gap: 12,
  },

  bottomButton: {
    flex: 1,
    height: 68,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },

  activeButton: {
    backgroundColor: "#005eff",
  },

  disabledButton: {
    backgroundColor: "#ececec",
  },

  bottomButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  disabledText: {
    color: "#c5c5c5",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 8,
  },

  menuBox: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 150,
    elevation: 5,
  },

  optionItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  optionText: {
    fontSize: 18,
    color: "#111",
  },
});