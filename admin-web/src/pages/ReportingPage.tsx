import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { RideRecord } from "../types";

function getTimestampMs(value: unknown) {
  if (!value) {
    return 0;
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return new Date(value).getTime();
  }

  return 0;
}

export default function ReportingPage() {
  const [rides, setRides] = useState<RideRecord[]>([]);

  useEffect(() => {
    const ridesQuery = query(collection(db, "rides"), orderBy("createdAt", "desc"));
    return onSnapshot(ridesQuery, (snapshot) => {
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<RideRecord, "id">),
      }));
      setRides(rows);
    });
  }, []);

  const metrics = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    let completed = 0;
    let ongoing = 0;
    let canceled = 0;
    let revenue = 0;
    let todayTrips = 0;

    for (const ride of rides) {
      const status = (ride.status || "").toLowerCase();
      if (status === "completed") {
        completed += 1;
        revenue += Number(ride.fare || 0);
      } else if (status === "ongoing") {
        ongoing += 1;
      } else if (status === "canceled") {
        canceled += 1;
      }

      const createdAt = getTimestampMs(ride.createdAt);
      if (createdAt >= startOfToday) {
        todayTrips += 1;
      }
    }

    return { completed, ongoing, canceled, revenue, todayTrips, total: rides.length };
  }, [rides]);

  return (
    <div className="stats-grid">
      <article className="stat-card">
        <h3>Total Rides</h3>
        <p>{metrics.total}</p>
      </article>
      <article className="stat-card">
        <h3>Trips Today</h3>
        <p>{metrics.todayTrips}</p>
      </article>
      <article className="stat-card">
        <h3>Completed</h3>
        <p>{metrics.completed}</p>
      </article>
      <article className="stat-card">
        <h3>Ongoing</h3>
        <p>{metrics.ongoing}</p>
      </article>
      <article className="stat-card">
        <h3>Canceled</h3>
        <p>{metrics.canceled}</p>
      </article>
      <article className="stat-card">
        <h3>Cash Revenue</h3>
        <p>₱{metrics.revenue.toFixed(2)}</p>
      </article>
    </div>
  );
}