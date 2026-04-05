import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { DriverRecord } from "../types";

export default function DriverApprovalsPage() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [savingId, setSavingId] = useState<string>("");

  useEffect(() => {
    const driversQuery = query(collection(db, "drivers"), orderBy("createdAt", "desc"));
    return onSnapshot(driversQuery, (snapshot) => {
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<DriverRecord, "id">),
      }));
      setDrivers(rows);
    });
  }, []);

  const pendingDrivers = useMemo(
    () =>
      drivers.filter((driver) => {
        const status = driver.approvalStatus?.toLowerCase();
        if (status) {
          return status === "pending";
        }
        return !driver.isApproved;
      }),
    [drivers]
  );

  async function setApproval(driverId: string, status: "approved" | "rejected") {
    setSavingId(driverId);
    try {
      await updateDoc(doc(db, "drivers", driverId), {
        approvalStatus: status,
        isApproved: status === "approved",
        reviewedAt: serverTimestamp(),
      });
    } finally {
      setSavingId("");
    }
  }

  return (
    <section className="card">
      <h2>Driver Approvals</h2>
      <p>{pendingDrivers.length} pending verification requests</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>License</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingDrivers.map((driver) => (
              <tr key={driver.id}>
                <td>{driver.fullName || "—"}</td>
                <td>{driver.email || "—"}</td>
                <td>{driver.phone || "—"}</td>
                <td>{driver.licenseNumber || "—"}</td>
                <td className="actions">
                  <button
                    onClick={() => setApproval(driver.id, "approved")}
                    disabled={savingId === driver.id}
                  >
                    Approve
                  </button>
                  <button
                    className="danger-btn"
                    onClick={() => setApproval(driver.id, "rejected")}
                    disabled={savingId === driver.id}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
            {pendingDrivers.length === 0 ? (
              <tr>
                <td colSpan={5}>No pending approvals.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}