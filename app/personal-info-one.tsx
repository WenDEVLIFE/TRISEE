import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import * as React from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";

const DrivingLicense = () => {
  const router = useRouter();

  const [showFrontMore, setShowFrontMore] = React.useState(false);
  const [showBackMore, setShowBackMore] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  const [frontImage, setFrontImage] = React.useState<string | null>(null);
  const [backImage, setBackImage] = React.useState<string | null>(null);

  const [licenseNumber, setLicenseNumber] = React.useState("");
  const [expirationDate, setExpirationDate] = React.useState("");
  const [ageAbove56, setAgeAbove56] = React.useState("");
  const [showAgeModal, setShowAgeModal] = React.useState(false);

  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [tempDate, setTempDate] = React.useState<Date>(new Date());
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem("personal-info-two");

        if (savedData) {
          const parsed = JSON.parse(savedData);
          setFrontImage(parsed.frontImage || null);
          setBackImage(parsed.backImage || null);
          setLicenseNumber(parsed.licenseNumber || "");
          setExpirationDate(parsed.expirationDate || "");
          setAgeAbove56(parsed.ageAbove56 || "");

          if (parsed.expirationDate) {
            const parsedDate = new Date(parsed.expirationDate);
            if (!isNaN(parsedDate.getTime())) {
              setSelectedDate(parsedDate);
              setTempDate(parsedDate);
            }
          }
        }
      } catch (error) {
        console.log("Failed to load saved data.");
      }
    };

    loadSavedData();
  }, []);

  const ageOptions = ["Yes", "No"];

  const isFrontImageValid = !!frontImage;
  const isBackImageValid = !!backImage;
  const isLicenseNumberValid = licenseNumber.trim().length > 0;
  const isExpirationDateValid = expirationDate.trim().length > 0;
  const isAgeAbove56Valid = ageAbove56.trim().length > 0;

  const isFormFilled =
    isFrontImageValid &&
    isBackImageValid &&
    isLicenseNumberValid &&
    isExpirationDateValid &&
    isAgeAbove56Valid;

  const pickImage = async (type: "front" | "back") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === "front") {
        setFrontImage(uri);
      } else {
        setBackImage(uri);
      }
    }
  };

  const formatDate = (date: Date) => {
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const openDatePicker = () => {
    const baseDate = selectedDate || new Date();
    setTempDate(baseDate);
    setShowDatePicker(true);
  };

  const handleDateChange = (_event: any, date?: Date) => {
  if (!date) return;

  // ✅ FORCE DAY = 1 (removes day relevance)
  const fixedDate = new Date(date.getFullYear(), date.getMonth(), 1);

  if (Platform.OS === "android") {
    setShowDatePicker(false);
    setSelectedDate(fixedDate);
    setExpirationDate(formatDate(fixedDate));
    return;
  }

  setTempDate(fixedDate);
};

  const confirmIOSDate = () => {
    setSelectedDate(tempDate);
    setExpirationDate(formatDate(tempDate));
    setShowDatePicker(false);
  };

  const handleNext = async () => {
    setTouched(true);

    if (!isFormFilled) return;

    try {
      const formData = {
        frontImage,
        backImage,
        licenseNumber,
        expirationDate,
        ageAbove56,
      };

      await AsyncStorage.setItem(
        "personal-info-two",
        JSON.stringify(formData)
      );

      router.push("/personal-info-two");
    } catch (error) {
      Alert.alert("Save failed");
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Image
          source={require("../assets/images/driving-license.png")}
          style={styles.topImage}
          resizeMode="contain"
        />

        <Text style={styles.title}>Driving License</Text>

        <View style={styles.uploadSection}>
          <View style={styles.textSection}>
            <Text style={styles.sectionTitle}>
              Driving License{"\n"}(Front) <Text style={styles.required}>*</Text>
            </Text>

            {showFrontMore ? (
              <>
                <Text style={styles.bullet}>• Documents should be 21 days before expiry</Text>
                <Text style={styles.bullet}>• Not a scan version</Text>
                <Text style={styles.bullet}>• Photo is clear</Text>
                <Text style={styles.bullet}>• Should be professional</Text>
                <TouchableOpacity onPress={() => setShowFrontMore(false)}>
                  <Text style={styles.showMore}>Show less</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.previewText}>Documents should be 21 day...</Text>
                <TouchableOpacity onPress={() => setShowFrontMore(true)}>
                  <Text style={styles.showMore}>Show more</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.uploadBox,
              touched && !isFrontImageValid && styles.errorBorder,
            ]}
            onPress={() => pickImage("front")}
          >
            {frontImage ? (
              <Image source={{ uri: frontImage }} style={styles.uploadedImage} />
            ) : (
              <>
                <Text style={styles.plus}>＋</Text>
                <Text style={styles.uploadText}>Upload Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        {touched && !isFrontImageValid && (
          <Text style={styles.errorTextUpload}>Required</Text>
        )}

        <View style={styles.uploadSection}>
          <View style={styles.textSection}>
            <Text style={styles.sectionTitle}>
              Driving License{"\n"}(Back) <Text style={styles.required}>*</Text>
            </Text>

            {showBackMore ? (
              <>
                <Text style={styles.backDescription}>
                  I-upload ang Orihinal na larawan ng Harap at Likod ng Lisensya
                  Hindi photocopy o Scanned Valid at hindi expired
                </Text>
                <TouchableOpacity onPress={() => setShowBackMore(false)}>
                  <Text style={styles.showMore}>Show less</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.previewText}>
                  I-upload ang Orihinal na lara...
                </Text>
                <TouchableOpacity onPress={() => setShowBackMore(true)}>
                  <Text style={styles.showMore}>Show more</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.uploadBox,
              touched && !isBackImageValid && styles.errorBorder,
            ]}
            onPress={() => pickImage("back")}
          >
            {backImage ? (
              <Image source={{ uri: backImage }} style={styles.uploadedImage} />
            ) : (
              <>
                <Text style={styles.plus}>＋</Text>
                <Text style={styles.uploadText}>Upload Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        {touched && !isBackImageValid && (
          <Text style={styles.errorTextUpload}>Required</Text>
        )}

        <Text style={styles.label}>
          License Number <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            touched && !isLicenseNumberValid && styles.errorBorder,
          ]}
          placeholder="License Number"
          placeholderTextColor="#c7c7c7"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
        />
        {touched && !isLicenseNumberValid && (
          <Text style={styles.errorText}>Required</Text>
        )}

        <Text style={styles.label}>
          Expiration Date <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={openDatePicker}
          style={[
            styles.inputIconWrap,
            touched && !isExpirationDateValid && styles.errorBorder,
          ]}
        >
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Expiration Date"
            placeholderTextColor="#c7c7c7"
            value={expirationDate}
            editable={false}
            pointerEvents="none"
          />
          <View style={styles.calendarIconWrap}>
            <Text style={styles.calendarIcon}>📅</Text>
          </View>
        </TouchableOpacity>
        {touched && !isExpirationDateValid && (
          <Text style={styles.errorText}>Required</Text>
        )}

        <Text style={styles.label}>
          Are you 56 years old and above? <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdown,
            touched && !isAgeAbove56Valid && styles.errorBorder,
          ]}
          onPress={() => setShowAgeModal(true)}
        >
          <Text
            style={[
              styles.dropdownText,
              !ageAbove56 && styles.placeholderText,
            ]}
          >
            {ageAbove56 || ""}
          </Text>
          <Text style={styles.dropdownArrow}>⌄</Text>
        </TouchableOpacity>
        {touched && !isAgeAbove56Valid && (
          <Text style={styles.errorText}>Required</Text>
        )}
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[
            styles.singleBottomButton,
            isFormFilled ? styles.activeButton : styles.disabledButton,
          ]}
          disabled={!isFormFilled}
          onPress={handleNext}
        >
          <Text
            style={[
              styles.bottomButtonText,
              !isFormFilled && styles.disabledText,
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showDatePicker && Platform.OS === "ios"}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable
          style={styles.dateModalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.dateModalBox}>
            <View style={styles.dateModalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.dateModalAction}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={confirmIOSDate}>
                <Text style={styles.dateModalAction}>Done</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              minimumDate={new Date()}
              themeVariant="light"
            />
          </Pressable>
        </Pressable>
      </Modal>

      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      <Modal
        visible={showAgeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAgeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAgeModal(false)}
        >
          <View style={styles.modalBox}>
            {ageOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.optionItem}
                onPress={() => {
                  setAgeAbove56(item);
                  setShowAgeModal(false);
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

export default DrivingLicense;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
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
    paddingBottom: 30,
  },

  topImage: {
    width: "100%",
    height: 120,
    alignSelf: "center",
    marginTop: 0,
    marginBottom: 12,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000",
    marginBottom: 26,
    paddingHorizontal: 30,
  },

  uploadSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 30,
    marginBottom: 10,
  },

  textSection: {
    width: "58%",
  },

  sectionTitle: {
    fontSize: 25,
    lineHeight: 40,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },

  required: {
    color: "red",
  },

  bullet: {
    fontSize: 16,
    lineHeight: 24,
    color: "#111",
    marginLeft: 10,
    marginBottom: 2,
  },

  backDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#111",
    marginBottom: 4,
  },

  previewText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#111",
    marginBottom: 4,
  },

  showMore: {
    fontSize: 16,
    color: "#0567d8",
    marginTop: 2,
  },

  uploadBox: {
    width: 150,
    height: 150,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#cfcfcf",
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },

  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
  },

  plus: {
    fontSize: 40,
    color: "#111",
    marginBottom: 6,
  },

  uploadText: {
    fontSize: 17,
    color: "#777",
    fontWeight: "500",
  },

  label: {
    fontSize: 17,
    color: "#222",
    marginBottom: 12,
    fontWeight: "500",
    paddingHorizontal: 30,
  },

  input: {
    height: 58,
    borderWidth: 1.5,
    borderColor: "#cfcfcf",
    borderRadius: 18,
    backgroundColor: "#fff",
    marginBottom: 8,
    marginHorizontal: 30,
    paddingHorizontal: 22,
    fontSize: 18,
    color: "#111",
  },

  inputIconWrap: {
    position: "relative",
    marginHorizontal: 30,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#cfcfcf",
    borderRadius: 18,
    backgroundColor: "#fff",
  },

  inputWithIcon: {
    height: 58,
    paddingHorizontal: 22,
    paddingRight: 56,
    fontSize: 18,
    color: "#111",
  },

  calendarIconWrap: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  calendarIcon: {
    fontSize: 24,
    color: "#005eff",
  },

  dropdown: {
    height: 58,
    borderWidth: 1.5,
    borderColor: "#cfcfcf",
    borderRadius: 18,
    backgroundColor: "#fff",
    marginBottom: 8,
    marginHorizontal: 30,
    paddingHorizontal: 22,
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
    color: "#b6b6b6",
  },

  bottomButtons: {
    paddingHorizontal: 22,
    paddingBottom: 18,
    paddingTop: 12,
    backgroundColor: "#f6f6f6",
  },

  singleBottomButton: {
    width: "100%",
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

  errorBorder: {
    borderColor: "#E53935",
  },

  errorText: {
    color: "#E53935",
    fontSize: 14,
    marginTop: 0,
    marginBottom: 16,
    marginHorizontal: 30,
  },

  errorTextUpload: {
    color: "#E53935",
    fontSize: 14,
    marginTop: -4,
    marginBottom: 16,
    paddingHorizontal: 30,
  },

  dateModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  dateModalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },

  dateModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ececec",
  },

  dateModalAction: {
    fontSize: 17,
    fontWeight: "600",
    color: "#005eff",
  },
});