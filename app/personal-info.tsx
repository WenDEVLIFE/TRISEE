import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import * as React from "react";
import {
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
import { auth, db } from "../firebaseConfig";

const PersonalInfo = () => {
  const router = useRouter();

  const [gender, setGender] = React.useState("Female");
  const [nationality, setNationality] = React.useState("Filipino");
  const [pwd, setPwd] = React.useState("NO");
  const [profileImage, setProfileImage] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const [showGenderModal, setShowGenderModal] = React.useState(false);
  const [showNationalityModal, setShowNationalityModal] = React.useState(false);
  const [showPwdModal, setShowPwdModal] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem("personal-info");
        if (saved) {
          const data = JSON.parse(saved);
          setGender(data.gender || "Female");
          setNationality(data.nationality || "Filipino");
          setPwd(data.pwd || "NO");
          setProfileImage(data.profileImage || null);
          setEmail(data.email || "");
          setPassword(data.password || "");
          setPhone(data.phone || "");
        }
      } catch (error) {
        console.log("Failed to load saved data");
      }
    };
    load();
  }, []);

  const genderOptions = ["Female", "Male", "Prefer not to say"];
  const nationalityOptions = ["Filipino", "Other"];
  const pwdOptions = ["NO", "YES"];

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission to access gallery is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleNext = async () => {
  try {
    let user;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      user = userCredential.user;
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        const login = await signInWithEmailAndPassword(auth, email, password);
        user = login.user;
      } else {
        throw error;
      }
    }

    const data = {
      gender,
      nationality,
      pwd,
      profileImage,
      email,
      phone,
    };

    try {
      await AsyncStorage.setItem("personal-info", JSON.stringify(data));
    } catch (storageError) {
      console.log("Local save failed");
    }

    router.push("/personal-info-one");

    try {
      await setDoc(doc(db, "drivers", user.uid), {
        uid: user.uid,
        email,
        phone,
        gender,
        nationality,
        pwd,
        profileImage,
        createdAt: new Date(),
      });
    } catch (firestoreError) {
      console.log("Firestore save failed:", firestoreError);
    }
  } catch (error: any) {
    alert(error.message);
  }
};
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Text style={styles.menuText}>⋮</Text>
          <View style={styles.redDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.greeting}>Hey Trisee Driver</Text>
        <Text style={styles.subtitle}>
          You're applying for <Text style={styles.boldText}>Trisee</Text>
        </Text>

        <View style={styles.profileWrap}>
          <TouchableOpacity style={styles.profileCircle} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.selectedImage} />
            ) : (
              <View style={styles.placeholderCircle}>
                <Text style={styles.placeholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>
          Email <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          placeholderTextColor="#b6b6b6"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>
          Password <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          placeholderTextColor="#b6b6b6"
          autoCapitalize="none"
        />

        <Text style={styles.label}>
          Phone Number <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholder="09XXXXXXXXX"
          placeholderTextColor="#b6b6b6"
        />

        <Text style={styles.label}>
          Gender <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowGenderModal(true)}
        >
          <Text style={styles.dropdownValue}>{gender}</Text>
          <Text style={styles.dropdownArrow}>⌄</Text>
        </TouchableOpacity>

        <Text style={styles.label}>
          Nationality <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowNationalityModal(true)}
        >
          <Text style={styles.dropdownValue}>{nationality}</Text>
          <Text style={styles.dropdownArrow}>⌄</Text>
        </TouchableOpacity>

        <Text style={styles.label}>
          Are you a PWD? <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowPwdModal(true)}
        >
          <Text style={styles.dropdownValue}>{pwd}</Text>
          <Text style={styles.dropdownArrow}>⌄</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.bottomButton, styles.activeButton]}
          onPress={handleNext}
        >
          <Text style={styles.bottomButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGenderModal(false)}
        >
          <View style={styles.modalBox}>
            {genderOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.optionItem}
                onPress={() => {
                  setGender(item);
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showNationalityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNationalityModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowNationalityModal(false)}
        >
          <View style={styles.modalBox}>
            {nationalityOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.optionItem}
                onPress={() => {
                  setNationality(item);
                  setShowNationalityModal(false);
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showPwdModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPwdModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPwdModal(false)}
        >
          <View style={styles.modalBox}>
            {pwdOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.optionItem}
                onPress={() => {
                  setPwd(item);
                  setShowPwdModal(false);
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showMenu} transparent animationType="fade">
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

export default PersonalInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  greeting: {
    fontSize: 34,
    fontWeight: "800",
    color: "#000",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: "#111",
    textAlign: "center",
    marginBottom: 34,
  },
  boldText: {
    fontWeight: "800",
  },
  profileWrap: {
    alignSelf: "center",
    marginBottom: 34,
    position: "relative",
  },
  profileCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#d9d9d9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  label: {
    fontSize: 17,
    color: "#222",
    marginBottom: 12,
    fontWeight: "500",
    paddingHorizontal: 22,
  },
  required: {
    color: "#ff4d30",
  },
  input: {
    height: 58,
    borderWidth: 1.5,
    borderColor: "#cfcfcf",
    borderRadius: 18,
    backgroundColor: "#fff",
    marginBottom: 30,
    marginHorizontal: 22,
    paddingHorizontal: 22,
    fontSize: 18,
    color: "#111",
  },
  dropdown: {
    height: 58,
    borderWidth: 1.5,
    borderColor: "#cfcfcf",
    borderRadius: 18,
    backgroundColor: "#fff",
    marginBottom: 30,
    marginHorizontal: 22,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownValue: {
    fontSize: 18,
    color: "#111",
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
  bottomButton: {
    width: "100%",
    height: 68,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#005eff",
  },
  bottomButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
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
  placeholderCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#efefef",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 16,
    color: "#777",
    fontWeight: "600",
  },
  selectedImage: {
    width: 170,
    height: 170,
    borderRadius: 85,
  },
});