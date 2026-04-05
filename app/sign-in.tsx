import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
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
import { auth } from "../firebaseConfig";

const SignIn = () => { 
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [usePhone, setUsePhone] = React.useState(false);

  const handleAuth = async () => {
  try {
    if (usePhone) {
      alert("Phone login uses OTP in Firebase.");
      return;
    }

    await signInWithEmailAndPassword(auth, identifier, password);
    router.push("/create-account");
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

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, !usePhone && styles.activeToggle]}
            onPress={() => {
              setUsePhone(false);
              setIdentifier("");
            }}
          >
            <Text
              style={[
                styles.toggleText,
                !usePhone && styles.activeToggleText,
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, usePhone && styles.activeToggle]}
            onPress={() => {
              setUsePhone(true);
              setIdentifier("");
            }}
          >
            <Text
              style={[
                styles.toggleText,
                usePhone && styles.activeToggleText,
              ]}
            >
              Phone Number
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder={usePhone ? "Enter phone number" : "Enter email"}
          placeholderTextColor="rgba(0,0,0,0.4)"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType={usePhone ? "phone-pad" : "email-address"}
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

        <TouchableOpacity onPress={() => router.push("/create-account")}>
          <Text style={styles.switchText}>No account yet? Sign Up</Text>
        </TouchableOpacity>

        {usePhone && (
          <Text style={styles.noteText}>
            Phone number + password needs a custom backend. Firebase only
            supports phone sign-in with OTP.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },

  scrollContainer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 40,
  },

  logo: {
    width: 800,
    height: 400,
    resizeMode: "contain",
    alignSelf: "center",
  },

  text: {
    fontSize: 23,
    fontWeight: "300",
    marginTop: -160,
    marginBottom: 10,
    color: "black",
    textAlign: "center",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    marginTop: 150,
    marginBottom: 10,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "black",
  },

  dividerText: {
    marginHorizontal: 10,
    fontSize: 17,
    color: "black",
    textAlign: "center",
  },

  toggleRow: {
    flexDirection: "row",
    width: "80%",
    marginBottom: 10,
    justifyContent: "space-between",
  },

  toggleButton: {
    width: "48%",
    height: 45,
    borderWidth: 1,
    borderColor: "#005eff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },

  activeToggle: {
    backgroundColor: "#005eff",
  },

  toggleText: {
    color: "#005eff",
    fontSize: 15,
    fontWeight: "600",
  },

  activeToggleText: {
    color: "white",
  },

  input: {
    width: "80%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginTop: 15,
    backgroundColor: "white",
    color: "black",
  },

  gButton: {
    backgroundColor: "#005eff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    width: "80%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  gButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  switchText: {
    marginTop: 20,
    fontSize: 15,
    color: "#005eff",
    fontWeight: "500",
    textAlign: "center",
  },

  noteText: {
    marginTop: 15,
    width: "80%",
    fontSize: 13,
    color: "gray",
    textAlign: "center",
  },
});

export default SignIn;