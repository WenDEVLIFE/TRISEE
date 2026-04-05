# IMMEDIATE ACTION: Fix Your Firestore Rules NOW

## 🚨 Your Problem
Registration says "Success" but data doesn't save in Firestore.

## ✅ Solution (3 Steps, 2 Minutes)

### Step 1: Open Firebase Console
Go to: **https://console.firebase.google.com**

### Step 2: Go to Firestore Rules
1. Click on your project "trisee-one"
2. Left sidebar → **Firestore Database**
3. Top tabs → **Rules**
4. You should see existing rules or blank editor

### Step 3: Replace All Rules With This

**DELETE everything in the Rules editor and paste this:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users (Passengers) - can read/write their own
    match /users/{uid} {
      allow create: if request.auth.uid == uid;
      allow read: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid;
    }
    
    // Drivers - can read/write their own (must verify email)
    match /drivers/{uid} {
      allow create: if request.auth.uid == uid && request.resource.data.emailVerified == true;
      allow read: if request.auth.uid == uid || resource.data.approvalStatus == "approved";
      allow update: if request.auth.uid == uid;
    }
    
    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 4: Click PUBLISH
- Look for blue **Publish** button (bottom right)
- Click it
- Wait for: "✓ Rules updated successfully"

### Step 5: Test Registration
1. Close the app and re-open it (or kill and restart)
2. Try registering with **NEW email** (e.g., test123@example.com)
3. When prompted for OTP, use the code shown in the alert
4. Click Create Account
5. **Check console** for success logs or error

---

## What To Look For

### ✅ SUCCESS (Console Shows):
```
[PassengerSignUp] Firestore write success for uid: abc123
[PassengerSignUp] Firestore profile saved successfully: abc123
Successfully navigating to home...
```
→ Check Firebase: users collection should have your data ✅

### ❌ FAILURE (Console Shows):
```
[PassengerSignUp] Firestore write error: Permission denied
[PassengerSignUp] Registration error: Permission denied
Error alert: "❌ Firestore Security Rules blocking write..."
```
→ Rules are STILL WRONG, check you published them correctly

### ❌ OTHER ERROR:
```
[PassengerSignUp] Firestore write error: ...
```
→ See what error appears, reply with screenshot

---

## Troubleshooting

**Q: Rules still not working?**
A: 
1. Did you click **Publish**? (Don't forget!)
2. Did you wait 5-10 seconds after publishing?
3. Close browser tab and re-open Firebase Console
4. Check the rules are still there

**Q: Still getting permission denied?**
A:
1. Go back to Rules editor
2. Make sure lines with `allow create:`, `allow read:`, `allow update:` are there
3. Check there's NO typo in "users" or "drivers"
4. Try again with TEST MODE rules (see below)

**Q: How to use TEST MODE (temporary)?**
A: For debugging, use these rules instead:
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
This allows ANYONE to read/write. If registration works now, your problem is the production rules. Then fix them properly.

---

## After Registration Works

1. ✅ Check **Firebase Auth** - your email should be listed
2. ✅ Check **Firestore** → users collection - your profile should be there:
   - `fullName`: "Your Name"
   - `email`: "your@email.com"
   - `phone`: ""
   - `role`: "user"
   - `userType`: "passenger"
   - `accountStatus`: "active"
   - `createdAt`, `updatedAt`: timestamps

If all this appears, **DONE!** Registration is working. ✅

---

**Next:** Reply with screenshot of Firebase showing the data saved, or with the error from console if it fails.
