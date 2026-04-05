import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import AccountManagementPage from "./pages/AccountManagementPage";
import DriverApprovalsPage from "./pages/DriverApprovalsPage";
import MonitoringPage from "./pages/MonitoringPage";
import ReportingPage from "./pages/ReportingPage";

type AuthState = {
  loading: boolean;
  user: User | null;
  isAdmin: boolean;
};

async function checkAdminRole(uid: string) {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    if (data.role === "admin" || data.userType === "admin") {
      return true;
    }
  }

  const adminDoc = await getDoc(doc(db, "admins", uid));
  return adminDoc.exists();
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const isAdmin = await checkAdminRole(credential.user.uid);
      if (!isAdmin) {
        await signOut(auth);
        setError("This account does not have admin access.");
        return;
      }
      navigate("/monitoring", { replace: true });
    } catch {
      setError("Unable to sign in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>TRISEE Admin</h1>
        <p>Sign in with your administrator account.</p>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function DashboardLayout({ user }: { user: User }) {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut() {
    await signOut(auth);
    navigate("/login", { replace: true });
  }

  const tabs = useMemo(
    () => [
      { to: "/monitoring", label: "Monitoring" },
      { to: "/driver-approvals", label: "Driver Approvals" },
      { to: "/reporting", label: "Reporting" },
      { to: "/accounts", label: "Account Management" },
    ],
    []
  );

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div>
          <h1>TRISEE Admin Panel</h1>
          <p>{user.email}</p>
        </div>
        <button className="danger-btn" onClick={handleSignOut}>
          Sign out
        </button>
      </header>
      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.to}
            className={location.pathname === tab.to ? "tab active" : "tab"}
            onClick={() => navigate(tab.to)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="content">
        <Routes>
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/driver-approvals" element={<DriverApprovalsPage />} />
          <Route path="/reporting" element={<ReportingPage />} />
          <Route path="/accounts" element={<AccountManagementPage />} />
          <Route path="*" element={<Navigate to="/monitoring" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedApp() {
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    loading: true,
    user: null,
    isAdmin: false,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState({ loading: false, user: null, isAdmin: false });
        return;
      }

      const isAdmin = await checkAdminRole(user.uid);
      setAuthState({ loading: false, user, isAdmin });
    });
  }, []);

  if (authState.loading) {
    return <div className="loading">Loading admin panel...</div>;
  }

  if (!authState.user) {
    return location.pathname === "/login" ? <LoginPage /> : <Navigate to="/login" replace />;
  }

  if (!authState.isAdmin) {
    return (
      <div className="loading">
        Signed in account is not an admin. Please contact super admin.
      </div>
    );
  }

  if (location.pathname === "/login") {
    return <Navigate to="/monitoring" replace />;
  }

  return <DashboardLayout user={authState.user} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<ProtectedApp />} />
    </Routes>
  );
}