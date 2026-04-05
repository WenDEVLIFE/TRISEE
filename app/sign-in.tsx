import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import * as React from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig";

const SignIn = () => { 
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleAuth = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;
      const userEmail = userCredential.user.email?.toLowerCase() || "";

      // Check if Admin (Auth-only check, completely bypasses collections)
      if (userEmail.includes("admin")) {
        router.replace("/admin/dashboard");
        return;
      }

      // Check if User (Passenger) exists
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists() && userDoc.data().role === "user") {
        router.replace("/passenger/home");
        return;
      }

      // Check if Driver exists
      const driverDoc = await getDoc(doc(db, "drivers", uid));
      if (driverDoc.exists()) {
        const driverData = driverDoc.data() || {};
        const hasUploadedIdDocs = Boolean(
          driverData.idType && driverData.idFrontImage && driverData.idBackImage
        );

        if (!hasUploadedIdDocs) {
          await AsyncStorage.setItem("driver-registration-uid", uid);
          await AsyncStorage.setItem(
            "driver-core-info",
            JSON.stringify({
              uid,
              fullName: driverData.fullName || "Driver",
              email: driverData.email || userCredential.user.email || "",
              phone: driverData.phone || "",
              gender: driverData.gender || "",
              nationality: driverData.nationality || "",
              pwd: driverData.pwd || "",
              profileImage: driverData.profileImage || null,
            })
          );
          router.replace("/personal-info-one");
          return;
        }

        router.replace("/driver/home");
        return;
      } else {
        router.push("/create-account");
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Something went wrong");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../assets/images/trisee.png")}
          style={styles.logo}
        />

        <Text style={styles.text}>Drive. Book. Go with Trisee</Text>

        <View style={styles.dividerContainer}>
          <View style={styles.line}></View>
          <Text style={styles.dividerText}>Log in</Text>
          <View style={styles.line}></View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter email"
          placeholderTextColor="rgba(0,0,0,0.4)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="rgba(0,0,0,0.4)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.gButton} onPress={handleAuth}>
          <Text style={styles.gButtonText}>Log In</Text>
        </TouchableOpacity>

        <View style={styles.signUpRow}>
          <Text style={styles.switchTextBase}>No account yet? Sign up as: </Text>
          <TouchableOpacity onPress={() => router.push("/passenger/sign-up")}>
            <Text style={styles.switchTextLink}>Passenger</Text>
          </TouchableOpacity>
          <Text style={styles.switchTextBase}> or </Text>
          <TouchableOpacity onPress={() => router.push("/create-account")}>
            <Text style={styles.switchTextLink}>Driver</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContainer: { alignItems: "center", paddingTop: 20, paddingBottom: 40 },
  logo: { width: 800, height: 400, resizeMode: "contain", alignSelf: "center" },
  text: { fontSize: 23, fontWeight: "300", marginTop: -160, marginBottom: 10, color: "black", textAlign: "center" },
  dividerContainer: { flexDirection: "row", alignItems: "center", width: "80%", marginTop: 150, marginBottom: 10 },
  line: { flex: 1, height: 1, backgroundColor: "black" },
  dividerText: { marginHorizontal: 10, fontSize: 17, color: "black", textAlign: "center" },
  input: { width: "80%", height: 50, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 15, marginTop: 15, backgroundColor: "white", color: "black" },
  gButton: { backgroundColor: "#005eff", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginTop: 20, width: "80%", height: 50, justifyContent: "center", alignItems: "center" },
  gButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  signUpRow: { flexDirection: "row", marginTop: 20, justifyContent: "center", alignItems: "center" },
  switchTextBase: { fontSize: 15, color: "gray", fontWeight: "500" },
  switchTextLink: { fontSize: 15, color: "#005eff", fontWeight: "bold" },
});

export default SignIn;