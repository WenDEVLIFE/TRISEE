# Common Firebase Errors & Quick Fixes

## During Registration, You Might See...

### 1. "Firestore access denied. Check security rules in Firebase Console."

**Cause:** Firestore Security Rules blocking document writes

**Fix:**
1. Go to Firebase Console → Firestore Database → Rules
2. Copy rules from `FIRESTORE_RULES.md`
3. Paste and click Publish
4. Try registration again

---

### 2. "This email is already registered."

**Cause:** The email already exists in Firebase Auth

**Fix:** Use a different email address

---

### 3. "Password is too weak. Use at least 6 characters."

**Cause:** Firebase password requirements not met

**Fix:** Use a password with:
- At least 6 characters
- Mix of letters and numbers recommended

---

### 4. "Database not found"

**Cause:** Firestore database not created in Firebase project

**Fix:**
1. Go to Firebase Console
2. Click Firestore Database
3. Click "Create database"
4. Choose "Production mode"
5. Select region (e.g., us-central1)
6. Click Create

---

### 5. "OTP Sent (Dev Mode) - Use this code for testing: 123456"

**Cause:** Email OTP endpoint not configured

**Fix (for testing):** Use the provided code - this is normal!

**Fix (for production):** Set up email endpoint:
```env
EXPO_PUBLIC_EMAIL_OTP_SEND_ENDPOINT=your-backend-url/api/otp/send
EXPO_PUBLIC_EMAIL_OTP_VERIFY_ENDPOINT=your-backend-url/api/otp/verify
```

---

### 6. "Invalid OTP code. Please check and try again."

**Cause:** Wrong OTP code entered

**Fix:** Check the dev fallback code shown in alert and enter exactly

---

### 7. "Email/Password auth is not enabled"

**Cause:** Firebase Authentication not configured

**Fix:**
1. Go to Firebase Console
2. Click Authentication
3. Click "Sign-in method"
4. Toggle "Email/Password" to ON
5. Save

---

### 8. "Phone verification failed"

**Cause:** reCAPTCHA not verified or invalid phone number

**Fix:**
- Make sure reCAPTCHA verification appears before entering code
- Use valid phone with country code (e.g., +11234567890)
- Ensure "Phone" sign-in method is enabled in Firebase

---

### 9. "Creating..." hangs for more than 10 seconds

**Cause:** Network issue or Firebase timeout

**Fix:**
1. Check internet connection
2. Try again
3. Check Firebase Console → Quotas for rate limits
4. Check https://status.firebase.google.com/ for outages

---

### 10. "Account Creation Failed - undefined error"

**Cause:** Catch block received unknown error type

**Fix:**
1. Check console logs for "[PassengerSignUp]" or "[DriverOTPVerify]"
2. Look for the full error message in red
3. Post the error message in debugging

---

## Quick Checklist When Registration Fails

- [ ] Check console for log messages (press F12 in browser)
- [ ] Look for red error text in console
- [ ] Check that Firestore database exists
- [ ] Verify Security Rules are published
- [ ] Confirm Email/Password auth is enabled
- [ ] Check internet connection
- [ ] Try a different email address
- [ ] Restart the app and try again
- [ ] Check Firebase status page for outages

---

## Debug Console Output

### ✅ Successful Registration Looks Like:

**Email mode:**
```
[PassengerSignUp] Creating email account: test@example.com
[PassengerSignUp] Auth account created: abc123xyz
[PassengerSignUp] Profile updated: John Doe
[PassengerSignUp] Saving passenger profile...
[PassengerSignUp] Firestore profile saved: abc123xyz
```

**Phone mode:**
```
[PassengerSignUp] Verifying phone OTP: +12025551234
[PassengerSignUp] Phone auth success: abc123xyz
[PassengerSignUp] Profile updated for phone auth
[PassengerSignUp] Saving passenger profile...
[PassengerSignUp] Profile saved for phone: abc123xyz
```

**Driver mode:**
```
[DriverOTPVerify] Sending OTP to: test@example.com
[DriverOTPVerify] OTP sent, dev fallback: Yes
[DriverOTPVerify] Verifying OTP code...
[DriverOTPVerify] OTP verified successfully
[DriverOTPVerify] Creating auth account for: test@example.com
[DriverOTPVerify] Auth account created: def456uvw
[DriverOTPVerify] Saving driver profile to Firestore...
[DriverOTPVerify] Driver profile saved: def456uvw
[DriverOTPVerify] Navigating to personal-info-one...
```

### ❌ Failed Registration Looks Like:

If logs **stop** at any point, that's where the failure happened:

```
[PassengerSignUp] Creating email account: test@example.com
[PassengerSignUp] Auth account created: abc123xyz
[PassengerSignUp] Profile updated: John Doe
[PassengerSignUp] Saving passenger profile...
[PassengerSignUp] Registration error: FirebaseError: Permission denied [Stuck here = Security Rules issue]
```

---

**Last Updated:** Current session
