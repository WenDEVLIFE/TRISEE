# Firestore Security Rules Quick Reference

## 🚀 COPY & PASTE THIS INTO YOUR FIREBASE CONSOLE

Go to: **Firebase Console → Firestore Database → Rules**

Delete everything and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // USERS (Passengers)
    // ============================================
    match /users/{uid} {
      // Users can read/write their own profile
      allow read: if request.auth.uid == uid;
      allow create: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid;
      allow delete: if false; // Prevent account deletion
    }
    
    // ============================================
    // DRIVERS
    // ============================================
    match /drivers/{uid} {
      // Drivers can read/write their own profile
      allow create: if request.auth.uid == uid && request.resource.data.emailVerified == true;
      allow read: if request.auth.uid == uid || resource.data.approvalStatus == "approved";
      allow update: if request.auth.uid == uid;
      allow delete: if false;
    }
    
    // ============================================
    // RIDES
    // ============================================
    match /rides/{rideId} {
      // Users can read/write rides they're involved in
      allow read: if request.auth.uid in resource.data.passengerIds || request.auth.uid == resource.data.driverId;
      allow create: if request.auth.uid in request.resource.data.passengerIds;
      allow update: if request.auth.uid in resource.data.passengerIds || request.auth.uid == resource.data.driverId;
      allow delete: if false;
    }
    
    // ============================================
    // ADMINS (Future use)
    // ============================================
    match /admins/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // ============================================
    // DENY ALL OTHER COLLECTIONS
    // ============================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## For Testing Only (REMOVE AFTER TESTING)

If you want to test without security restrictions:

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

**⚠️ WARNING:** This allows ANYONE to read/write ALL data. Only use for local testing!

---

## 📋 Key Points

| Rule | Effect |
|------|--------|
| `allow read: if request.auth.uid == uid` | User can only read their own document |
| `allow create: if request.auth.uid == uid` | User must be authenticated to create their own document |
| `allow update: if request.auth.uid == uid` | User can only update their own document |
| `allow delete: if false` | Nobody can delete documents |
| `request.resource.data.emailVerified == true` | Document must have emailVerified=true when created |
| `resource.data.approvalStatus == "approved"` | Only approved drivers can be read by others |

---

## ✅ After Pasting Rules

1. Click **Publish** button (bottom right)
2. Wait for "✓ Rules updated successfully" message
3. Go back to your app
4. Try registration again
5. Check console logs

---

**Last Updated:** Current session
