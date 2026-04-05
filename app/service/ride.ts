import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    runTransaction,
    serverTimestamp,
    setDoc
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

type TimestampLike = {
  seconds?: number;
  nanoseconds?: number;
};

export type RideStatus =
  | "searching"
  | "accepted"
  | "arrived"
  | "ongoing"
  | "completed"
  | "cancelled";

export type PaymentStatus = "cash_pending" | "paid" | "cancelled";

export type DriverSummary = {
  uid: string;
  fullName: string;
  phone: string;
  profileImage: string;
  isOnline: boolean;
  approvalStatus?: string;
  accountStatus?: string;
  plateNumber?: string;
  vehicleName?: string;
  idType?: string;
  currentLat?: number;
  currentLon?: number;
  currentLocationUpdatedAt?: unknown;
};

export type RideDoc = {
  rideId: string;
  passengerUid: string;
  passengerName: string;
  passengerPhone: string;
  assignedDriverId: string;
  assignedDriverName: string;
  assignedDriverPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  fareType: "regular" | "discount";
  fareAmount: number;
  status: RideStatus;
  paymentStatus: PaymentStatus;
  reportRecorded: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  acceptedAt?: unknown;
  completedAt?: unknown;
  cancelledAt?: unknown;
  cancellationReason?: string;
};

export type RideRequest = {
  passengerUid: string;
  passengerName: string;
  passengerPhone: string;
  assignedDriverId: string;
  assignedDriverName: string;
  assignedDriverPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  fareType: "regular" | "discount";
  fareAmount: number;
};

export type RideListenerResult = RideDoc & {
  id: string;
};

export type AvailableDriver = DriverSummary;

export type PlatformOverview = {
  totalRides: number;
  revenue: number;
  weeklyRides: { day: string; rides: number }[];
  updatedAt?: unknown;
};

export type PlatformOverviewListenerResult = PlatformOverview & {
  id: string;
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toRideListenerResult(id: string, data: Record<string, unknown>): RideListenerResult {
  const fareType = data.fareType === "discount" ? "discount" : "regular";
  const fallbackFareAmount = fareType === "discount" ? 15 : 20;
  const parsedFareAmount = Number(data.fareAmount);

  return {
    id,
    rideId: typeof data.rideId === "string" ? data.rideId : id,
    passengerUid: typeof data.passengerUid === "string" ? data.passengerUid : "",
    passengerName: typeof data.passengerName === "string" ? data.passengerName : "",
    passengerPhone: typeof data.passengerPhone === "string" ? data.passengerPhone : "",
    assignedDriverId: typeof data.assignedDriverId === "string" ? data.assignedDriverId : "",
    assignedDriverName: typeof data.assignedDriverName === "string" ? data.assignedDriverName : "",
    assignedDriverPhone: typeof data.assignedDriverPhone === "string" ? data.assignedDriverPhone : "",
    pickupLocation: typeof data.pickupLocation === "string" ? data.pickupLocation : "",
    dropoffLocation: typeof data.dropoffLocation === "string" ? data.dropoffLocation : "",
    fareType,
    fareAmount: Number.isFinite(parsedFareAmount) && parsedFareAmount > 0 ? parsedFareAmount : fallbackFareAmount,
    status: (typeof data.status === "string" ? data.status : "searching") as RideStatus,
    paymentStatus: (typeof data.paymentStatus === "string" ? data.paymentStatus : "cash_pending") as PaymentStatus,
    reportRecorded: data.reportRecorded === true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    acceptedAt: data.acceptedAt,
    completedAt: data.completedAt,
    cancelledAt: data.cancelledAt,
    cancellationReason: typeof data.cancellationReason === "string" ? data.cancellationReason : undefined,
  };
}

function toDriverSummary(uid: string, data: Record<string, unknown>): DriverSummary {
  return {
    uid,
    fullName: typeof data.fullName === "string" ? data.fullName : "Driver",
    phone: typeof data.phone === "string" ? data.phone : "",
    profileImage: typeof data.profileImage === "string" ? data.profileImage : "",
    isOnline: data.isOnline === true,
    approvalStatus: typeof data.approvalStatus === "string" ? data.approvalStatus : undefined,
    accountStatus: typeof data.accountStatus === "string" ? data.accountStatus : undefined,
    plateNumber: typeof data.plateNumber === "string" ? data.plateNumber : undefined,
    vehicleName: typeof data.vehicleName === "string" ? data.vehicleName : undefined,
    idType: typeof data.idType === "string" ? data.idType : undefined,
    currentLat: typeof data.currentLat === "number" ? data.currentLat : undefined,
    currentLon: typeof data.currentLon === "number" ? data.currentLon : undefined,
    currentLocationUpdatedAt: data.currentLocationUpdatedAt,
  };
}

function getTimestampMillis(value: unknown) {
  const timestamp = value as TimestampLike | null | undefined;
  if (!timestamp || typeof timestamp.seconds !== "number") return 0;
  return timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1_000_000);
}

function buildWeeklyRides(currentWeekly: unknown, incrementDay: string) {
  const existing = Array.isArray(currentWeekly) ? currentWeekly : [];
  const merged = WEEK_DAYS.map((day) => {
    const found = existing.find((item) => {
      const record = item as { day?: unknown; rides?: unknown };
      return record?.day === day;
    }) as { day?: unknown; rides?: unknown } | undefined;

    return {
      day,
      rides: Number(found?.rides || 0),
    };
  });

  return merged.map((item) =>
    item.day === incrementDay ? { ...item, rides: item.rides + 1 } : item
  );
}

function toPlatformOverview(id: string, data: Record<string, unknown>): PlatformOverviewListenerResult {
  const currentWeekly = Array.isArray(data.weeklyRides) ? data.weeklyRides : [];

  const weeklyRides = WEEK_DAYS.map((day) => {
    const found = currentWeekly.find((item) => {
      const record = item as { day?: unknown; rides?: unknown };
      return record?.day === day;
    }) as { day?: unknown; rides?: unknown } | undefined;

    return {
      day,
      rides: Number(found?.rides || 0),
    };
  });

  return {
    id,
    totalRides: Number(data.totalRides || 0),
    revenue: Number(data.revenue || 0),
    weeklyRides,
    updatedAt: data.updatedAt,
  };
}

export function subscribeAvailableDrivers(
  onUpdate: (drivers: AvailableDriver[]) => void
) {
  return onSnapshot(collection(db, "drivers"), (snapshot) => {
    const drivers = snapshot.docs
      .map((driverDoc) => toDriverSummary(driverDoc.id, driverDoc.data() as Record<string, unknown>))
      .filter(
        (driver) =>
          driver.isOnline &&
          driver.accountStatus !== "disabled" &&
          driver.approvalStatus !== "rejected"
      );

    onUpdate(drivers);
  });
}

export function subscribeIncomingRideRequests(
  driverUid: string,
  onUpdate: (rides: RideListenerResult[]) => void
) {
  return onSnapshot(collection(db, "rides"), (snapshot) => {
    const rides = snapshot.docs
      .map((rideDoc) => toRideListenerResult(rideDoc.id, rideDoc.data() as Record<string, unknown>))
      .filter((ride) => ride.assignedDriverId === driverUid && ride.status === "searching")
      .sort((left, right) => getTimestampMillis(right.createdAt) - getTimestampMillis(left.createdAt));

    onUpdate(rides);
  });
}

export function subscribeRideById(
  rideId: string,
  onUpdate: (ride: RideListenerResult | null) => void
) {
  return onSnapshot(doc(db, "rides", rideId), (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate(null);
      return;
    }

    onUpdate(toRideListenerResult(snapshot.id, snapshot.data() as Record<string, unknown>));
  });
}

export function subscribePassengerRideHistory(
  passengerUid: string,
  onUpdate: (rides: RideListenerResult[]) => void
) {
  return onSnapshot(collection(db, "rides"), (snapshot) => {
    const rides = snapshot.docs
      .map((rideDoc) => toRideListenerResult(rideDoc.id, rideDoc.data() as Record<string, unknown>))
      .filter((ride) => ride.passengerUid === passengerUid)
      .sort((left, right) => getTimestampMillis(right.createdAt) - getTimestampMillis(left.createdAt));

    onUpdate(rides);
  });
}

export function subscribeDriverRideHistory(
  driverUid: string,
  onUpdate: (rides: RideListenerResult[]) => void
) {
  return onSnapshot(collection(db, "rides"), (snapshot) => {
    const rides = snapshot.docs
      .map((rideDoc) => toRideListenerResult(rideDoc.id, rideDoc.data() as Record<string, unknown>))
      .filter((ride) => ride.assignedDriverId === driverUid)
      .sort((left, right) => getTimestampMillis(right.createdAt) - getTimestampMillis(left.createdAt));

    onUpdate(rides);
  });
}

export function subscribePlatformOverview(
  onUpdate: (overview: PlatformOverviewListenerResult | null) => void
) {
  return onSnapshot(doc(db, "analytics", "platform_overview"), (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate(null);
      return;
    }

    onUpdate(toPlatformOverview(snapshot.id, snapshot.data() as Record<string, unknown>));
  });
}

export async function createRideRequest(request: RideRequest) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Please sign in again to book a ride.");
  }

  const passengerDoc = await getDoc(doc(db, "users", currentUser.uid));
  const passengerData = passengerDoc.data() as Record<string, unknown> | undefined;

  const rideRef = doc(collection(db, "rides"));
  const rideId = rideRef.id;

  const fareType = request.fareType === "discount" ? "discount" : "regular";
  const fallbackFareAmount = fareType === "discount" ? 15 : 20;
  const parsedFareAmount = Number(request.fareAmount);
  const fareAmount = Number.isFinite(parsedFareAmount) && parsedFareAmount > 0 ? parsedFareAmount : fallbackFareAmount;

  await setDoc(rideRef, {
    rideId,
    passengerUid: currentUser.uid,
    passengerName:
      request.passengerName ||
      (typeof passengerData?.fullName === "string" ? passengerData.fullName : currentUser.displayName || "Passenger"),
    passengerPhone:
      request.passengerPhone ||
      (typeof passengerData?.phone === "string" ? passengerData.phone : ""),
    assignedDriverId: request.assignedDriverId,
    assignedDriverName: request.assignedDriverName,
    assignedDriverPhone: request.assignedDriverPhone,
    pickupLocation: request.pickupLocation,
    dropoffLocation: request.dropoffLocation,
    fareType,
    fareAmount,
    status: "searching",
    paymentStatus: "cash_pending",
    reportRecorded: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    acceptedAt: null,
    completedAt: null,
    cancelledAt: null,
  });

  return rideId;
}

export async function acceptRideRequest(rideId: string, driver: DriverSummary) {
  await setDoc(
    doc(db, "rides", rideId),
    {
      assignedDriverId: driver.uid,
      assignedDriverName: driver.fullName,
      assignedDriverPhone: driver.phone,
      status: "accepted",
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function rejectRideRequest(rideId: string) {
  await setDoc(
    doc(db, "rides", rideId),
    {
      status: "cancelled",
      cancellationReason: "driver_rejected",
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateRideStage(rideId: string, status: "arrived" | "ongoing") {
  await setDoc(
    doc(db, "rides", rideId),
    {
      status,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function cancelRide(rideId: string, reason = "passenger_cancelled") {
  await setDoc(
    doc(db, "rides", rideId),
    {
      status: "cancelled",
      cancellationReason: reason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function completeRideAndRecord(rideId: string, fareAmount?: number) {
  const rideRef = doc(db, "rides", rideId);
  const reportRef = doc(db, "analytics", "platform_overview");

  await runTransaction(db, async (transaction) => {
    const rideSnap = await transaction.get(rideRef);
    if (!rideSnap.exists()) {
      throw new Error("Ride not found.");
    }

    const rideData = rideSnap.data() as Record<string, unknown>;
    if (rideData.reportRecorded === true) {
      return;
    }

    const reportSnap = await transaction.get(reportRef);
    const reportData = reportSnap.exists() ? (reportSnap.data() as Record<string, unknown>) : {};

    const finalFare = Number(fareAmount ?? rideData.fareAmount ?? 0);
    const totalRides = Number(reportData.totalRides || 0) + 1;
    const revenue = Number(reportData.revenue || 0) + finalFare;
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDay = dayLabels[new Date().getDay()] || "Mon";
    const weeklyRides = buildWeeklyRides(reportData.weeklyRides, currentDay);

    transaction.set(
      rideRef,
      {
        status: "completed",
        paymentStatus: "paid",
        fareAmount: finalFare,
        completedAt: serverTimestamp(),
        reportRecorded: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      reportRef,
      {
        totalRides,
        revenue,
        weeklyRides,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}
