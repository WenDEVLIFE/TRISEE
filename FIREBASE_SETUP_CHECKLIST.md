# Firebase Setup Checklist for TRISEE App

## Problem: "Creating..." hangs during passenger registration

The registration flow hangs when trying to create a Firestore document. This is typically caused by **Firestore Security Rules**.

## ✅ Checklist - Complete these steps in Firebase Console

### 1. **Firestore Database Security Rules**

Go to **Firebase Console → Firestore Database → Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow users to read/write their own profile
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow create, update: if request.auth.uid == uid;
    }
    
    // Allow users to read public driver info
    match /drivers/{driverId} {
      allow read: if true;
      allow create, update, delete: if request.auth.uid == driverId && resource.data.emailVerified == true && resource.data.approvalStatus == "approved";
    }
    
    // Rides - users can read/write their own rides
    match /rides/{rideId} {
      allow read: if request.auth.uid in resource.data.passengers || request.auth.uid == resource.data.driverId;
      allow create: if request.auth.uid in request.resource.data.passengers;
      allow update: if request.auth.uid in resource.data.passengers || request.auth.uid == resource.data.driverId;
    }
    
    // Admins (future expansion)
    match /admins/{adminId} {
      allow read, write: if request.auth.uid == adminId;
    }
  }
}
```

### 2. **Firebase Authentication Methods**

Go to **Firebase Console → Authentication → Sign-in method** and enable:
- ✅ Email/Password
- ✅ Phone (with reCAPTCHA - should auto-configure)

### 3. **Enable Firestore Database**

Go to **Firebase Console → Firestore Database**:
- If you see "Create database" button, click it
- Choose **Production mode** (NOT test mode)
- Select region (e.g., `us-central1`)
- Click "Create"

### 4. **Verify Collections Structure**

Your Firestore should have these root collections:
- `users/` - Passenger profiles
- `drivers/` - Driver profiles
- `rides/` - Active/completed rides
- `admins/` - Admin accounts

Collections are auto-created when documents are first written.

### 5. **Check Authentication Status**

Run this in Expo with **Expo dev server**:
```bash
npx expo start
```

Open browser console (F12) and look for these logs when testing:
```
[PassengerSignUp] Creating email account: test@example.com
[PassengerSignUp] Auth account created: {uid}
[PassengerSignUp] Profile updated: {name}
[PassengerSignUp] Saving passenger profile...
[PassengerSignUp] Firestore profile saved: {uid}
```

If logging stops after "Firestore profile saved..." starts, **Security Rules are blocking the write**.

### 6. **Test Direct Firestore Write**

In Firebase Console, manually add a test document:
- Go to **Firestore → Collection: users**
- Click **Add collection**
- Set document ID to a test UID (e.g., `test-uid-123`)
- Add these fields:
  - `fullName`: "Test User"
  - `email`: "test@example.com"
  - `phone`: ""
  - `role`: "user"
  - `userType`: "passenger"
  - `accountStatus`: "active"
  - `isDisabled`: false
  - `phoneVerified`: false

If you can manually create this document but the app can't, **Security Rules are definitely the issue**.

### 7. **Verify API Key Restrictions (if set)**

Go to **Firebase Console → Project Settings → Service Accounts → Admin SDK**:
- Check if there are API key restrictions
- If restricted to specific APIs, ensure **Cloud Firestore API** is included

## 🔍 Debugging Steps

1. **Check browser/emulator console for logs** - Look for where the logs stop
2. **Check Firebase Console Activity** - Authentication shows successful sign-ups? If yes, then `setDoc` is failing
3. **Try TEST mode Security Rules** - Temporarily allow all reads/writes for testing:
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
   If registration works with this, Security Rules are blocking. Then apply the proper rules from step 1.

4. **Check if `db` object is initialized** - Add this to `firebaseConfig.js`:
   ```javascript
   console.log("Firebase DB initialized:", db);
   ```

## 📋 Common Issues

| Issue | Solution |
|-------|----------|
| "Creating..." hangs, no error | Security Rules blocking write |
| Error: "Permission denied" in console | Same as above |
| Error: "Database not found" | Database not created; go to Firestore and create it |
| Email auth shows "user-not-found" | Email doesn't exist in Firebase Auth |
| Phone OTP doesn't send | reCAPTCHA not verified or SMS quota exceeded |

## ✨ Quick Test

After setting Security Rules, try this test account:
- Email: `test@trisee.app`
- Password: `Test123456!`

If registration completes, the setup is correct.

---

**Last Updated:** [Current Session]
**Status:** Need to verify Firestore Security Rules
