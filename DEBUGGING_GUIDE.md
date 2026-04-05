# Debugging the "Creating..." Hang Issue

## What I've Done

I've added comprehensive console logging and improved error handling to help identify where the registration process is hanging. Here's what was updated:

### 1. **Enhanced Error Messages**
Both passenger (`sign-up.tsx`) and driver (`driver-otp-verify.tsx`) screens now detect specific errors:
- **Permission denied** → Firestore Security Rules blocking writes
- **Email already in use** → Account exists
- **Weak password** → Password requirements not met
- **Invalid OTP** / **Code expired** → Phone/Email OTP issues

### 2. **Console Logging Added**
The following logs will appear in your Expo dev console when registration happens:

#### Passenger Email Mode:
```
[PassengerSignUp] Creating email account: test@example.com
[PassengerSignUp] Auth account created: {uid}
[PassengerSignUp] Profile updated: {name}
[PassengerSignUp] Saving passenger profile...
[PassengerSignUp] Firestore profile saved: {uid}
```

#### Passenger Phone Mode:
```
[PassengerSignUp] Verifying phone OTP: +1234567890
[PassengerSignUp] Phone auth success: {uid}
[PassengerSignUp] Profile updated for phone auth
[PassengerSignUp] Saving passenger profile...
[PassengerSignUp] Profile saved for phone: {uid}
```

#### Driver Email Mode:
```
[DriverOTPVerify] Sending OTP to: test@example.com
[DriverOTPVerify] OTP sent, dev fallback: Yes
[DriverOTPVerify] Verifying OTP code...
[DriverOTPVerify] OTP verified successfully
[DriverOTPVerify] Creating auth account for: test@example.com
[DriverOTPVerify] Auth account created: {uid}
[DriverOTPVerify] Saving driver profile to Firestore...
[DriverOTPVerify] Driver profile saved: {uid}
[DriverOTPVerify] Navigating to personal-info-one...
```

## How to Debug

### Step 1: Check Console Output
When the registration hangs at "Creating...", open your Expo dev console:
- **Web/Browser:** Press `F12` → Console tab
- **Emulator:** Android Studio → Logcat
- **Physical device:** `adb logcat | grep ReactNativeJS`

### Step 2: Find Where It Stops
Look for the logs above. If you see:
- ✅ All logs appear → Bug is in navigation, not registration
- ❌ Logs stop at "Saving passenger profile..." → **Firestore Security Rules issue**
- ❌ Logs stop at "Auth account created..." → Network timeout or Firebase Auth issue
- ❌ No logs at all → Button click not registering

### Step 3: Check for Error Logs
Look for red error messages like:
```
[PassengerSignUp] Registration error: FirebaseError: Permission denied
[PassengerSignUp] Registration error: FirebaseError: PERMISSION_DENIED
```

## Most Common Fix

**99% of the time, the issue is Firestore Security Rules.**

### Quick Fix for Testing

In your **Firebase Console** → **Firestore Database** → **Rules**, temporarily replace ALL rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write;
    }
  }
}
```

**Then test registration.** If it works, you have a Security Rules issue. If it still fails, skip to "Advanced Debugging."

After confirming this works, deploy the proper rules from `FIREBASE_SETUP_CHECKLIST.md`.

## Advanced Debugging

If the quick fix doesn't work, try these:

### Check 1: Is Firestore Database Created?
- Open Firebase Console
- Go to **Firestore Database**
- Do you see "Create database" button?
- If yes, **click it** → Production mode → Create

### Check 2: Is Email/Password Auth Enabled?
- Firebase Console → **Authentication** → **Sign-in method**
- Is "Email/Password" toggled ON?
- If no, toggle it ON

### Check 3: Are Security Rules Valid?
- Firebase Console → **Firestore** → **Rules**
- Click "Validate" button at top
- Do you see red errors?
- If yes, fix the syntax

### Check 4: Add Temporary Logging to Firestore Write
Open `app/passenger/sign-up.tsx` and after the console.log, add a test write:

```typescript
console.log("[PassengerSignUp] Saving passenger profile...");

// TEST WRITE - Remove after debugging
try {
  await setDoc(
    doc(db, "test", "write-test"),
    { testData: "success", timestamp: serverTimestamp() },
    { merge: true }
  );
  console.log("[PassengerSignUp] TEST WRITE SUCCESS");
} catch (testError) {
  console.error("[PassengerSignUp] TEST WRITE FAILED:", testError);
}

// ACTUAL WRITE
await savePassengerProfile({...});
```

If the test write succeeds but actual write fails, there's a data structure issue.

### Check 5: Verify `db` Object
Add this to `firebaseConfig.js` after `const db = getFirestore(app);`:

```javascript
console.log("[Firebase] DB initialized:", db);
console.log("[Firebase] DB app:", db.app.name);
```

This confirms the database connection is working.

## Network Timeout Scenario

If logs show the operation started but never completed (stuck at a step), it's likely a timeout:

1. **Check internet connection** on device/emulator
2. **Check Firebase quota** - Go to Firebase Console → Quotas. If anything is red, you've hit a limit
3. **Restart the app** and try again
4. **Check Firebase Status** - https://status.firebase.google.com/ for outages

## Reproduction Steps for Testing

1. Start Expo dev server: `npx expo start`
2. Open in emulator or press `w` for web
3. Click "Create Account"
4. **Email Mode:**
   - Enter: Email, Password, Name
   - Click "Send Email OTP"
   - Use the dev fallback code shown
   - Click "Verify OTP"
   - Click "Create Account"
   - Watch console for logs
5. **Phone Mode:**
   - Enter: Phone, Password, Name
   - Click "Send Phone OTP"
   - Enter test code (6 digits)
   - Click "Verify & Create"
   - Watch console for logs

## If All Else Fails

Open Firebase Console → **Firestore** → **Exceptions** tab (if available) to see what writes are failing.

---

**Updated:** Current session
**Status:** Ready to debug with added console logs and better error messages
