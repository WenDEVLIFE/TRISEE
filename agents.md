# TRISEE - Tricycle Ride-Hailing / Booking App
**Platform:** Mobile (React Native / Expo)
**Backend:** Firebase
**Payment Strategy:** Physical Cash Only (No online payments)

## App Overview
TRISEE is a ride-hailing application tailored explicitly for Tricycles. The application is segregated into three primary components:
1. **User (Passenger) App**
2. **Driver App**
3. **Admin Panel (Web)**

### 1. User (Passenger) App
- **Authentication:** Sign up / Login via Firebase Auth.
- **Profile Management:** Users can manage their personal profiles.
- **Booking Flow:**
  - Book a ride.
  - Select pickup and drop-off locations (Map Integration).
  - View nearby drivers.
- **Ride Tracking & Status:**
  - Searching, Accepted, Ongoing, Completed.
- **Actionable Features:**
  - Cancel booking.
  - View ride history.
  - Rate drivers.

### 2. Driver App
- **Authentication:** Sign up / Login via Firebase Auth.
- **Onboarding:**
  - Upload documents (License, ID) directly to Firebase Storage.
  - Profile completion is *required* prior to accepting any rides.
- **Availability:** Go Online / Offline toggle.
- **Booking Management:**
  - Receive booking requests.
  - Accept or Reject bookings.
- **Navigation:** Integrated map navigation to pickup / drop-off points.
- **Ride Status Updates:**
  - Accepted -> Arrived -> Ongoing -> Completed.

### 3. Admin Panel (Web)
- **Monitoring:** View all registered users and drivers.
- **Driver Approvals:** Approve or Reject driver applications / document verifications.
- **Reporting:** View reports on rides, drivers, and users.
- **Account Management:** Disable accounts when necessary.

---

## Existing Codebase Structure

The project employs **Expo Router** for navigation and routing. The current codebase has primarily laid out the foundation for authentication and initial onboarding profile setups.

### Directory Breakdown
- `/app` - Contains all routing and primary screen implementations.
  - `_layout.tsx`: Root layout configuration.
  - `index.tsx`: Main entry point (often redirects based on auth state).
  - `home.tsx`: Main dashboard screen.
  - `sign-in.tsx`: Login screen.
  - `create-account.tsx`: Registration screen.
  - `personal-info*.tsx`: A multi-step flow for capturing user or driver details (`personal-info.tsx`, `personal-info-one.tsx`, `personal-info-two.tsx`, `personal-info-three.tsx`, `personal-info-four.tsx`).
- `firebaseConfig.js`: Holds Firebase initialization and connection details.

## Agent Instructions for Future Enhancements
When working on new features on this codebase, adhere to the following:
1. **Tech Stack Respect:** Build heavily around React Native, Expo Router, and Firebase. Use existing patterns for navigation.
2. **Data Handling:** Do not implement Stripe or online payment SDKs. Transactions are entirely cash-based.
3. **Role Separation:** Ensure that Firebase rules and application logic explicitly segregate standard users from drivers and administrators.
4. **State Management:** When writing new rides/booking implementations, use real-time listeners (Firebase Realtime DB or Firestore onSnapshot) for real-time ride tracking statuses.
5. **Component Modularity:** If adding repetitive forms or UI components, consider extracting them into a `/components` directory to prevent `/app` from getting too bloated.
