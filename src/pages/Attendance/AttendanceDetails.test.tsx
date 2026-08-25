import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AttendanceDetails from "./AttendanceDetails";
import { attendanceService } from "../../services/attendanceService";
import type { Attendance } from "../../types/attendance.types";
import { jest } from "@jest/globals";

jest.mock("../../services/attendanceService");

// Mock date-fns via locale methods used in component
jest.spyOn(Date.prototype, "toLocaleTimeString").mockImplementation(() => "09:00:00 AM");
jest.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(() => "Monday, January 1, 2024");

describe("AttendanceDetails Page", () => {
    const mockRecord = {
        _id: "att1",
        date: "2024-01-01",
        userId: "user1",
        employeeId: {
            _id: "user1",
            personalInfo: { firstName: "John", lastName: "Doe", email: "john@test.com" },
            username: "johndoe"
        },
        status: "present",
        checkIn: { time: "2024-01-01T09:00:00Z", deviceInfo: "Chrome" },
        checkOut: { time: "2024-01-01T17:00:00Z" },
        sessions: [
            {
                _id: "sess1",
                checkIn: { time: "2024-01-01T09:00:00Z" },
                checkOut: { time: "2024-01-01T13:00:00Z" },
                duration: 240,
                durationString: "4h 0m"
            },
            {
                _id: "sess2",
                checkIn: { time: "2024-01-01T14:00:00Z" },
                checkOut: { time: "2024-01-01T17:00:00Z" },
                duration: 180,
                durationString: "3h 0m"
            }
        ],
        breaks: [
            {
                _id: "brk1",
                startTime: "2024-01-01T13:00:00Z",
                endTime: "2024-01-01T14:00:00Z",
                duration: 60,
                durationString: "1h 0m"
            }
        ],
        totalHours: 7,
        breakTime: 60,
        totalDurationString: "7h 0m",
        totalBreakDurationString: "1h 0m",
        isLate: false,
        isHoliday: false
    };

    beforeEach(() => {
        jest.mocked(attendanceService.getByDateAndUser).mockResolvedValue(mockRecord as unknown as Attendance);
    });

    it("renders loading state initially", () => {
        // Since loader might be global, check for message if possible or just wait
        render(
            <MemoryRouter initialEntries={["/attendance/2024-01-01/user1"]}>
                <Routes>
                    <Route path="/attendance/:date/:userId" element={<AttendanceDetails />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText(/Syncing records/i)).toBeInTheDocument();
    });

    it("renders attendance details after loading", async () => {
        render(
            <MemoryRouter initialEntries={["/attendance/2024-01-01/user1"]}>
                <Routes>
                    <Route path="/attendance/:date/:userId" element={<AttendanceDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Attendance Detail/i)).toBeInTheDocument();
            expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
            expect(screen.getByText(/john@test.com/i)).toBeInTheDocument();
            // Using regex for flexibility
            expect(screen.getAllByText(/7h 0m/i).length).toBeGreaterThan(0);
        });
    });

    it("displays late status if applicable", async () => {
        jest.mocked(attendanceService.getByDateAndUser).mockResolvedValue({
            ...mockRecord,
            isLate: true
        } as unknown as Attendance);

        render(
            <MemoryRouter initialEntries={["/attendance/2024-01-01/user1"]}>
                <Routes>
                    <Route path="/attendance/:date/:userId" element={<AttendanceDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Late Arrival")).toBeInTheDocument();
        });
    });

    it("displays sessions and breaks", async () => {
        render(
            <MemoryRouter initialEntries={["/attendance/2024-01-01/user1"]}>
                <Routes>
                    <Route path="/attendance/:date/:userId" element={<AttendanceDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Work Sessions")).toBeInTheDocument();
            expect(screen.getByText("Break Breakdown")).toBeInTheDocument();
            expect(screen.getByText("2 Segments")).toBeInTheDocument();
        });
    });
});

