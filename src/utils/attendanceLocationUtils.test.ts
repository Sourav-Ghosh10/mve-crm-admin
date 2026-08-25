import {
  extractLocationFields,
  normalizeAttendanceCheck,
  normalizeAttendanceRecord,
  enrichAttendancesWithLiveLocations,
  resolveCheckInLocation,
} from "./attendanceLocationUtils";
import type { Attendance } from "../types/attendance.types";

describe("attendanceLocationUtils", () => {
  it("extracts nested location fields", () => {
    expect(
      extractLocationFields({
        location: { lat: 12.34, lng: 56.78, address: "Test Street" },
      })
    ).toEqual({
      latitude: 12.34,
      longitude: 56.78,
      address: "Test Street",
    });
  });

  it("normalizes check-in with nested location", () => {
    const check = normalizeAttendanceCheck({
      time: "2026-05-26T06:47:00.000Z",
      location: { latitude: 22.5, longitude: 88.3, address: "Kolkata" },
    });

    expect(check?.latitude).toBe(22.5);
    expect(check?.longitude).toBe(88.3);
    expect(check?.address).toBe("Kolkata");
  });

  it("resolves location from session after normalization", () => {
    const record: Attendance = {
      _id: "1",
      employeeId: { _id: "emp1", personalInfo: { email: "a@b.com" } } as Attendance["employeeId"],
      date: "2026-05-26",
      checkIn: { time: "2026-05-26T06:47:00.000Z", ipAddress: "" },
      sessions: [
        {
          _id: "s1",
          checkIn: {
            time: "2026-05-26T06:47:00.000Z",
            ipAddress: "",
            location: { lat: 10, lng: 20, formattedAddress: "Office" },
          } as unknown as Attendance["checkIn"],
          duration: 0,
          isLate: false,
          isEarlyLeave: false,
        },
      ],
      breaks: [],
      status: "present",
      totalHours: 0,
      overtime: 0,
      remarks: "",
      punctuality: "Late",
      isLate: true,
      isEarlyLeave: false,
      createdAt: "",
      updatedAt: "",
    };

    const normalized = normalizeAttendanceRecord(record);
    const loc = resolveCheckInLocation(normalized);

    expect(loc?.latitude).toBe(10);
    expect(loc?.longitude).toBe(20);
    expect(loc?.address).toBe("Office");
  });

  it("enriches from last active location when summary omits geo", () => {
    const record: Attendance = {
      _id: "1",
      employeeId: { _id: "emp1", personalInfo: { email: "a@b.com" } } as Attendance["employeeId"],
      date: "2026-05-26",
      checkIn: { time: "2026-05-26T06:47:00.000Z", ipAddress: "" },
      sessions: [
        {
          _id: "s1",
          checkIn: { time: "2026-05-26T06:47:00.000Z", ipAddress: "" },
          duration: 0,
          isLate: false,
          isEarlyLeave: false,
        },
      ],
      breaks: [],
      status: "present",
      totalHours: 0,
      overtime: 0,
      remarks: "",
      punctuality: "Late",
      isLate: true,
      isEarlyLeave: false,
      createdAt: "",
      updatedAt: "",
    };

    const [enriched] = enrichAttendancesWithLiveLocations([record], [
      {
        _id: "emp1",
        lastActiveLocation: {
          latitude: 28.6,
          longitude: 77.2,
          address: "Delhi HQ",
        },
      },
    ]);

    const loc = resolveCheckInLocation(enriched);
    expect(loc?.address).toBe("Delhi HQ");
    expect(loc?.latitude).toBe(28.6);
  });
});
