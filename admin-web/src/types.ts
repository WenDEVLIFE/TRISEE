export type AppRole = "user" | "driver" | "admin";

export type AccountStatus = "active" | "disabled";

export type UserRecord = {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: AppRole | string;
  accountStatus?: AccountStatus | string;
  isDisabled?: boolean;
  createdAt?: unknown;
};

export type DriverRecord = {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  approvalStatus?: "pending" | "approved" | "rejected" | string;
  isApproved?: boolean;
  accountStatus?: AccountStatus | string;
  isDisabled?: boolean;
  createdAt?: unknown;
};

export type RideRecord = {
  id: string;
  status?: "searching" | "accepted" | "ongoing" | "completed" | "canceled" | string;
  fare?: number;
  createdAt?: unknown;
  completedAt?: unknown;
};