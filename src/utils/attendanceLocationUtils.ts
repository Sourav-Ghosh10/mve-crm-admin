import type { Attendance, AttendanceCheck, AttendanceSession } from "../types/attendance.types";

type LocationLike = Record<string, unknown>;

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const toString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  return str.length > 0 ? str : undefined;
};

/** Extract latitude, longitude, and address from assorted API location shapes. */
export const extractLocationFields = (source: unknown): Pick<AttendanceCheck, "latitude" | "longitude" | "address"> => {
  if (!source || typeof source !== "object") {
    return {};
  }

  const loc = source as LocationLike;

  let latitude =
    toNumber(loc.latitude) ??
    toNumber(loc.lat) ??
    toNumber(loc.Latitude);

  let longitude =
    toNumber(loc.longitude) ??
    toNumber(loc.lng) ??
    toNumber(loc.lon) ??
    toNumber(loc.Longitude);

  let address =
    toString(loc.address) ??
    toString(loc.formattedAddress) ??
    toString(loc.formatted_address) ??
    toString(loc.locationName) ??
    toString(loc.location_name);

  const nested = loc.location ?? loc.geo ?? loc.geolocation ?? loc.coords;
  if (nested && typeof nested === "object") {
    const nestedFields = extractLocationFields(nested);
    latitude = latitude ?? nestedFields.latitude;
    longitude = longitude ?? nestedFields.longitude;
    address = address ?? nestedFields.address;
  }

  const coordinates = loc.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const lng = toNumber(coordinates[0]);
    const lat = toNumber(coordinates[1]);
    if (lng !== undefined && lat !== undefined) {
      longitude = longitude ?? lng;
      latitude = latitude ?? lat;
    }
  }

  if (loc.type === "Point" && Array.isArray(coordinates) && coordinates.length >= 2) {
    const lng = toNumber(coordinates[0]);
    const lat = toNumber(coordinates[1]);
    if (lng !== undefined && lat !== undefined) {
      longitude = longitude ?? lng;
      latitude = latitude ?? lat;
    }
  }

  return { latitude, longitude, address };
};

/** Normalize a check-in/out payload so latitude, longitude, and address are always top-level. */
export const normalizeAttendanceCheck = (check: unknown): AttendanceCheck | undefined => {
  if (!check || typeof check !== "object") return undefined;

  const raw = check as LocationLike;
  const time = toString(raw.time) ?? (typeof raw.time === "string" ? raw.time : undefined);
  if (!time && !raw.latitude && !raw.lat && !raw.location) {
    return undefined;
  }

  const fromSelf = extractLocationFields(raw);
  const fromNested = extractLocationFields(raw.location ?? raw.geo ?? raw.geolocation);

  return {
    time: time || "",
    ipAddress: toString(raw.ipAddress) || toString(raw.ip) || "",
    deviceInfo: toString(raw.deviceInfo) ?? toString(raw.device),
    latitude: fromSelf.latitude ?? fromNested.latitude,
    longitude: fromSelf.longitude ?? fromNested.longitude,
    address: fromSelf.address ?? fromNested.address,
  };
};

const mergeCheck = (existing: unknown, incoming: AttendanceCheck): AttendanceCheck => {
  const base = normalizeAttendanceCheck(existing) || { time: incoming.time, ipAddress: "" };
  return {
    ...base,
    latitude: base.latitude ?? incoming.latitude,
    longitude: base.longitude ?? incoming.longitude,
    address: base.address ?? incoming.address,
  };
};

const normalizeSession = (session: AttendanceSession): AttendanceSession => {
  const sessionRaw = session as AttendanceSession & {
    checkInLocation?: unknown;
    clockInLocation?: unknown;
  };

  let checkIn = normalizeAttendanceCheck(sessionRaw.checkIn);
  const sessionLocation = extractLocationFields(
    sessionRaw.checkInLocation ?? sessionRaw.clockInLocation
  );

  if (checkIn && (sessionLocation.latitude || sessionLocation.address)) {
    checkIn = {
      ...checkIn,
      latitude: checkIn.latitude ?? sessionLocation.latitude,
      longitude: checkIn.longitude ?? sessionLocation.longitude,
      address: checkIn.address ?? sessionLocation.address,
    };
  } else if (!checkIn && sessionLocation.latitude) {
    checkIn = { time: "", ipAddress: "", ...sessionLocation };
  }

  return {
    ...session,
    checkIn: checkIn || session.checkIn,
    checkOut: normalizeAttendanceCheck(session.checkOut) || session.checkOut,
  };
};

/** Normalize attendance record location fields after API mapping. */
export const normalizeAttendanceRecord = (record: Attendance): Attendance => {
  const recordRaw = record as Attendance & {
    checkInLocation?: unknown;
    clockInLocation?: unknown;
    lastActiveLocation?: unknown;
  };

  const topLevelLoc = extractLocationFields(
    recordRaw.checkInLocation ?? recordRaw.clockInLocation ?? recordRaw.lastActiveLocation
  );

  let checkIn = normalizeAttendanceCheck(record.checkIn);
  if (checkIn && (topLevelLoc.latitude || topLevelLoc.address)) {
    checkIn = {
      ...checkIn,
      latitude: checkIn.latitude ?? topLevelLoc.latitude,
      longitude: checkIn.longitude ?? topLevelLoc.longitude,
      address: checkIn.address ?? topLevelLoc.address,
    };
  }

  const sessions = (record.sessions || []).map(normalizeSession);

  if (sessions.length > 0 && sessions[0].checkIn) {
    const first = sessions[0].checkIn;
    if (topLevelLoc.latitude || topLevelLoc.address) {
      sessions[0] = {
        ...sessions[0],
        checkIn: {
          ...first,
          latitude: first.latitude ?? topLevelLoc.latitude,
          longitude: first.longitude ?? topLevelLoc.longitude,
          address: first.address ?? topLevelLoc.address,
        },
      };
    }
  } else if (checkIn && (topLevelLoc.latitude || topLevelLoc.address)) {
    checkIn = { ...checkIn, ...topLevelLoc };
  }

  return {
    ...record,
    checkIn: checkIn || record.checkIn,
    sessions,
  };
};

export const getAttendanceEmployeeId = (record: Attendance): string | undefined => {
  const emp = record.employeeId;
  if (!emp) return undefined;
  if (typeof emp === "string") return emp;
  return emp._id || (emp as { id?: string }).id;
};

/** Resolve the check-in payload used for location display (first session or top-level checkIn). */
export const resolveCheckInLocation = (record: Attendance): AttendanceCheck | undefined => {
  const normalized = normalizeAttendanceRecord(record);
  const sessions = normalized.sessions || [];
  if (sessions.length > 0 && sessions[0].checkIn) {
    return sessions[0].checkIn;
  }
  return normalizeAttendanceCheck(normalized.checkIn);
};

export interface LiveLocationUser {
  _id?: string;
  id?: string;
  lastActiveLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    updatedAt?: string;
  };
}

/** Fill missing clock-in location from /location/last-active when the summary API omits it. */
export const enrichAttendancesWithLiveLocations = (
  attendances: Attendance[],
  liveUsers: LiveLocationUser[]
): Attendance[] => {
  const locationByUserId = new Map<string, AttendanceCheck>();

  for (const user of liveUsers) {
    const userId = user._id || user.id;
    const loc = user.lastActiveLocation;
    if (!userId || !loc) continue;

    const fields = extractLocationFields(loc);
    if (!fields.latitude && !fields.address) continue;

    locationByUserId.set(String(userId), {
      time: "",
      ipAddress: "",
      ...fields,
    });
  }

  return attendances.map((record) => {
    const normalized = normalizeAttendanceRecord(record);
    const existing = resolveCheckInLocation(normalized);
    if (existing?.latitude || existing?.address) {
      return normalized;
    }

    const empId = getAttendanceEmployeeId(normalized);
    if (!empId) return normalized;

    const liveCheck = locationByUserId.get(String(empId));
    if (!liveCheck) return normalized;

    const sessions = [...(normalized.sessions || [])];
    if (sessions.length > 0) {
      sessions[0] = {
        ...sessions[0],
        checkIn: mergeCheck(sessions[0].checkIn, liveCheck),
      };
    } else if (normalized.checkIn) {
      return {
        ...normalized,
        checkIn: mergeCheck(normalized.checkIn, liveCheck),
        sessions,
      };
    } else {
      return {
        ...normalized,
        checkIn: liveCheck,
        sessions,
      };
    }

    return { ...normalized, sessions };
  });
};
