import { Linking } from "react-native";
import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

import { SyncUserHealthConnectData } from "@/api/user/user";

const healthPermissions = [
  {
    accessType: "read" as const,
    recordType: "Steps" as const,
  },
  {
    accessType: "read" as const,
    recordType: "Distance" as const,
  },
  {
    accessType: "read" as const,
    recordType: "TotalCaloriesBurned" as const,
  },
];

function formatHealthConnectTitle(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `Health Connect (${day}/${month})`;
}

function formatSyncDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function openHealthConnectSettings() {
  try {
    await Linking.openURL("healthconnect://permissions");
  } catch (error) {
    await Linking.openSettings();
  }
}

export async function requestHealthConnectPermissions() {
  const status = await getSdkStatus();

  if (
    status === SdkAvailabilityStatus.SDK_UNAVAILABLE ||
    status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
  ) {
    throw new Error("Health Connect chưa khả dụng trên thiết bị này");
  }

  const initialized = await initialize();

  if (!initialized) {
    throw new Error("Không thể khởi tạo Health Connect");
  }

  const grantedPermissions = await requestPermission(healthPermissions);

  console.log(
    "Health Connect granted permissions:",
    JSON.stringify(grantedPermissions, null, 2),
  );

  const hasStepsPermission = grantedPermissions.some(
    (permission: any) =>
      permission.accessType === "read" &&
      permission.recordType === "Steps",
  );

  const hasDistancePermission = grantedPermissions.some(
    (permission: any) =>
      permission.accessType === "read" &&
      permission.recordType === "Distance",
  );

  const hasCaloriesPermission = grantedPermissions.some(
    (permission: any) =>
      permission.accessType === "read" &&
      permission.recordType === "TotalCaloriesBurned",
  );

  if (!hasStepsPermission) {
    await openHealthConnectSettings();
    throw new Error("Bạn chưa cấp quyền đọc số bước từ Health Connect");
  }

  return {
    hasStepsPermission,
    hasDistancePermission,
    hasCaloriesPermission,
  };
}

export async function syncTodayHealthConnect() {
  const permissions = await requestHealthConnectPermissions();

  const now = new Date();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const timeRangeFilter = {
    operator: "between" as const,
    startTime: start.toISOString(),
    endTime: now.toISOString(),
  };

  const steps = await readRecords("Steps", {
    timeRangeFilter,
  });

  const distance = permissions.hasDistancePermission
    ? await readRecords("Distance", {
        timeRangeFilter,
      })
    : { records: [] };

  const calories = permissions.hasCaloriesPermission
    ? await readRecords("TotalCaloriesBurned", {
        timeRangeFilter,
      })
    : { records: [] };

  const totalSteps = steps.records.reduce(
    (sum: number, item: any) => sum + Number(item.count || 0),
    0,
  );

  const totalDistanceMeters = distance.records.reduce(
    (sum: number, item: any) =>
      sum + Number(item.distance?.inMeters || 0),
    0,
  );

  const totalCalories = calories.records.reduce(
    (sum: number, item: any) =>
      sum + Number(item.energy?.inKilocalories || 0),
    0,
  );

  if (totalSteps <= 0 && totalDistanceMeters <= 0) {
    throw new Error("Không có dữ liệu Health Connect hôm nay");
  }

  const syncDate = formatSyncDate(now);

  return SyncUserHealthConnectData({
    name: formatHealthConnectTitle(now),
    workoutType: "Run",
    recordType: "health_connect",

    distance: totalDistanceMeters / 1000,
    movingTime: 0,
    steps: totalSteps,
    calories: totalCalories,
    startDate: start.toISOString(),

    healthConnectSyncDate: syncDate,
    externalId: `health-connect-${syncDate}`,
  });
}