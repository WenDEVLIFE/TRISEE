# TRISEE Admin Panel (Web)

Frontend for TRISEE admin operations:

- Monitoring registered users and drivers
- Driver approval and rejection workflows
- Ride reporting summary cards
- Account enable/disable management

## Tech

- React + TypeScript + Vite
- Firebase Auth
- Firestore realtime listeners (`onSnapshot`)

## Run locally

```bash
cd admin-web
npm install
npm run dev
```

## Build

```bash
cd admin-web
npm run build
```

## Role access expectation

The panel allows access when the authenticated user is recognized as admin by either:

- `users/{uid}.role === "admin"`
- `users/{uid}.userType === "admin"`
- or an existing `admins/{uid}` document

## Notes

- Account disable in this frontend updates Firestore status fields. Ensure Firebase Security Rules and backend flows enforce disabled account behavior.
- Driver approvals update `drivers/{id}` fields: `approvalStatus`, `isApproved`, and `reviewedAt`.