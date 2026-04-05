import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";

type AccountRow = {
  id: string;
  collectionName: "users" | "drivers";
  fullName?: string;
  email?: string;
  role?: string;
  isDisabled?: boolean;
  accountStatus?: string;
};

export default function AccountManagementPage() {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    const usersUnsub = onSnapshot(query(collection(db, "users")), (snapshot) => {
      setRows((previous) => {
        const filtered = previous.filter((row) => row.collectionName !== "users");
        const next = snapshot.docs.map((entry) => {
          const data = entry.data();
          return {
            id: entry.id,
            collectionName: "users" as const,
            fullName: data.fullName,
            email: data.email,
            role: data.role || "user",
            isDisabled: data.isDisabled,
            accountStatus: data.accountStatus,
          };
        });
        return [...filtered, ...next];
      });
    });

    const driversUnsub = onSnapshot(query(collection(db, "drivers")), (snapshot) => {
      setRows((previous) => {
        const filtered = previous.filter((row) => row.collectionName !== "drivers");
        const next = snapshot.docs.map((entry) => {
          const data = entry.data();
          return {
            id: entry.id,
            collectionName: "drivers" as const,
            fullName: data.fullName,
            email: data.email,
            role: "driver",
            isDisabled: data.isDisabled,
            accountStatus: data.accountStatus,
          };
        });
        return [...filtered, ...next];
      });
    });

    return () => {
      usersUnsub();
      driversUnsub();
    };
  }, []);

  const filteredRows = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) {
      return rows;
    }
    return rows.filter((row) => {
      const fullName = (row.fullName || "").toLowerCase();
      const email = (row.email || "").toLowerCase();
      return fullName.includes(key) || email.includes(key);
    });
  }, [rows, search]);

  async function setAccountStatus(row: AccountRow, disabled: boolean) {
    setSavingId(row.id);
    try {
      await updateDoc(doc(db, row.collectionName, row.id), {
        isDisabled: disabled,
        accountStatus: disabled ? "disabled" : "active",
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSavingId("");
    }
  }

  return (
    <section className="card">
      <h2>Account Management</h2>
      <p>Disable accounts when necessary and re-enable when resolved.</p>
      <input
        className="search-input"
        placeholder="Search by name or email"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const disabled = row.isDisabled || row.accountStatus === "disabled";
              return (
                <tr key={`${row.collectionName}-${row.id}`}>
                  <td>{row.fullName || "—"}</td>
                  <td>{row.email || "—"}</td>
                  <td>{row.role || row.collectionName}</td>
                  <td>{disabled ? "Disabled" : "Active"}</td>
                  <td>
                    {disabled ? (
                      <button onClick={() => setAccountStatus(row, false)} disabled={savingId === row.id}>
                        Enable
                      </button>
                    ) : (
                      <button
                        className="danger-btn"
                        onClick={() => setAccountStatus(row, true)}
                        disabled={savingId === row.id}
                      >
                        Disable
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5}>No accounts matched your search.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}