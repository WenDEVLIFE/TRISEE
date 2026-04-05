import AsyncStorage from "@react-native-async-storage/async-storage";
import { createUserWithEmailAndPassword, deleteUser, updateProfile, User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../firebaseConfig";

async function uploadLocalFileToStorage(uri: string, storagePath: string) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, blob);
    return getDownloadURL(fileRef);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to upload ${storagePath}: ${message}`);
  }
}

export async function registerPassengerWithEmailOtp(params: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    params.email.trim(),
    params.password
  );

  await updateProfile(credential.user, { displayName: params.fullName.trim() });

  try {
    await setDoc(
      doc(db, "users", credential.user.uid),
      {
        uid: credential.user.uid,
        fullName: params.fullName.trim(),
        email: params.email.trim(),
        phone: params.phoneNumber.trim(),
        role: "user",
        userType: "passenger",
        accountStatus: "active",
        isDisabled: false,
        phoneVerified: false,
        emailVerified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    await deleteUser(credential.user).catch(() => {});
    throw error;
  }

  return credential.user;
}

export async function finalizeDriverRegistration(uid: string) {
  const [licenseStepRaw, clearanceStepRaw, declarationStepRaw] = await Promise.all([
    AsyncStorage.getItem("driver-license-info"),
    AsyncStorage.getItem("driver-clearance-info"),
    AsyncStorage.getItem("driver-declaration-info"),
  ]);

  const personalInfoRaw = await AsyncStorage.getItem("driver-core-info");
  const personalInfo = personalInfoRaw ? JSON.parse(personalInfoRaw) : {};
  const licenseStep = licenseStepRaw ? JSON.parse(licenseStepRaw) : {};
  const clearanceStep = clearanceStepRaw ? JSON.parse(clearanceStepRaw) : {};
  const declarationStep = declarationStepRaw ? JSON.parse(declarationStepRaw) : {};

  const uploadMaybe = async (uri?: string | null, storagePath?: string) => {
    if (!uri || !storagePath) return null;
    if (uri.startsWith("http")) return uri;
    return uploadLocalFileToStorage(uri, storagePath);
  };

  let profileImageUrl: string | null = null;
  let licenseFrontUrl: string | null = null;
  let licenseBackUrl: string | null = null;
  let clearanceUrl: string | null = null;

  try {
    [profileImageUrl, licenseFrontUrl, licenseBackUrl, clearanceUrl] = await Promise.all([
      uploadMaybe(personalInfo.profileImage, `drivers/${uid}/profile.jpg`),
      uploadMaybe(licenseStep.frontImage, `drivers/${uid}/license-front.jpg`),
      uploadMaybe(licenseStep.backImage, `drivers/${uid}/license-back.jpg`),
      uploadMaybe(clearanceStep.uploadedImage, `drivers/${uid}/clearance.jpg`),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Driver document upload failed: ${message}`);
  }

  try {
    await setDoc(
      doc(db, "drivers", uid),
      {
        uid,
        fullName: personalInfo.fullName || "Driver",
        email: personalInfo.email || "",
        phone: personalInfo.phone || "",
        gender: personalInfo.gender || "",
        nationality: personalInfo.nationality || "",
        pwd: personalInfo.pwd || "",
        idType: licenseStep.idType || personalInfo.idType || "Driver License",
        idFrontImage: licenseFrontUrl || null,
        idBackImage: licenseBackUrl || null,
        licenseNumber: licenseStep.licenseNumber || "",
        expirationDate: licenseStep.expirationDate || "",
        ageAbove56: licenseStep.ageAbove56 || "",
        clearanceType: clearanceStep.clearance || "",
        clearanceImage: clearanceUrl || null,
        clearancePromiseChecked: clearanceStep.promiseChecked || false,
        declarationItems: declarationStep.checkedItems || [],
        profileImage: profileImageUrl || personalInfo.profileImage || null,
        accountStatus: "active",
        isDisabled: false,
        approvalStatus: "pending",
        registrationComplete: true,
        emailVerified: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Driver profile save failed: ${message}`);
  }
}
