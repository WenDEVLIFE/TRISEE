import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { DriverRecord, UserRecord } from "../types";

export default function MonitoringPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);

  useEffect(() => {
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const driversQuery = query(collection(db, "drivers"), orderBy("createdAt", "desc"));

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<UserRecord, "id">),
      }));
      setUsers(rows);
    });

    const unsubDrivers = onSnapshot(driversQuery, (snapshot) => {
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<DriverRecord, "id">),
      }));
      setDrivers(rows);
    });

    return () => {
      unsubUsers();
      unsubDrivers();
    };
  }, []);

  return (
    <div className="grid-two">
      <section className="card">
        <h2>Registered Users</h2>
        <p>{users.length} total</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id}>
                  <td>{row.fullName || "—"}</td>
                  <td>{row.email || "—"}</td>
                  <td>{row.isDisabled || row.accountStatus === "disabled" ? "Disabled" : "Active"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Registered Drivers</h2>
        <p>{drivers.length} total</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Approval</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((row) => (
                <tr key={row.id}>
                  <td>{row.fullName || "—"}</td>
                  <td>{row.email || "—"}</td>
                  <td>{row.approvalStatus || (row.isApproved ? "approved" : "pending")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}