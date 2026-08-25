import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UserProfile from "./UserProfile";
import { userService } from "../../services/userService";
import { jest } from "@jest/globals";
import type { User } from "../../types/user.types";

jest.mock("../../services/userService");

describe("UserProfile Page", () => {
    const mockUser = {
        _id: "123",
        username: "johndoe",
        personalInfo: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            phone: "+1234567890",
            address: {
                street: "123 Main St",
                city: "New York",
                state: "NY",
                country: "USA",
                zipCode: "10001"
            }
        },
        employment: {
            designation: "Software Engineer",
            department: "Engineering",
            employmentType: "full-time",
            location: "Remote",
            dateOfJoining: "2023-01-01",
            workingHours: {
                startTime: "09:00",
                endTime: "18:00",
                weeklyOff: ["Sat", "Sun"]
            }
        },
        permissions: {
            canApproveLeave: true,
            canApproveReimbursement: false,
            canManageSchedule: true,
            canViewReports: true
        },
        isActive: true,
        isAdmin: true
    };

    beforeEach(() => {
        jest.mocked(userService.getById).mockResolvedValue(mockUser as unknown as User);
    });

    it("renders loading state then profile info", async () => {
        render(
            <MemoryRouter initialEntries={["/users/123"]}>
                <Routes>
                    <Route path="/users/:id" element={<UserProfile />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/Retreiving Profile/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("John Doe")).toBeInTheDocument();
            expect(screen.getByText("Software Engineer")).toBeInTheDocument();
            expect(screen.getByText("Engineering")).toBeInTheDocument();
        });
    });

    it("shows error state when user not found", async () => {
        jest.mocked(userService.getById).mockResolvedValue(null as unknown as User);

        render(
            <MemoryRouter initialEntries={["/users/999"]}>
                <Routes>
                    <Route path="/users/:id" element={<UserProfile />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Profile Not Found/i)).toBeInTheDocument();
        });
    });
});

