import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import AccountManagementPage from "./pages/AccountManagementPage";
import DriverApprovalsPage from "./pages/DriverApprovalsPage";
import MonitoringPage from "./pages/MonitoringPage";
import ReportingPage from "./pages/ReportingPage";

type AuthState = {
  loading: boolean;
  user: User | null;
};

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
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/monitoring", { replace: true });
    } catch (error) {
      const code = error instanceof Error ? (error as { code?: string }).code : undefined;
      console.error("Admin sign-in failed:", error);

      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError(`Invalid email or password${code ? ` (${code})` : ""}.`);
        return;
      }

      if (code === "permission-denied") {
        setError(`Firestore blocked access${code ? ` (${code})` : ""}.`);
        return;
      }

      if (code === "auth/network-request-failed") {
        setError(`Network error while signing in${code ? ` (${code})` : ""}.`);
        return;
      }

      setError(`Unable to sign in${code ? ` (${code})` : ""}.`);
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
  });

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthState({ loading: false, user });
    });
  }, []);

  if (authState.loading) {
    return <div className="loading">Loading admin panel...</div>;
  }

  if (location.pathname === "/login") {
    return authState.user ? <Navigate to="/monitoring" replace /> : <LoginPage />;
  }

  if (!authState.user) {
    return <Navigate to="/login" replace />;
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