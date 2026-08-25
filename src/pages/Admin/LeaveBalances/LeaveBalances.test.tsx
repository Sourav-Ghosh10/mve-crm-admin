import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LeaveBalances from "./LeaveBalances";
import { userService } from "../../../services/userService";
import { leaveService } from "../../../services/leaveService";
import { jest } from "@jest/globals";
import type { User, PaginatedUserResponse } from "../../../types/user.types";
import type { EmployeeLeaveBalanceResponse } from "../../../types/leave.types";

jest.mock("../../../services/userService");
jest.mock("../../../services/leaveService");
jest.mock("../../../hooks/useDebounce", () => ({
    useDebounce: <T,>(value: T) => value,
}));

describe("LeaveBalances Page", () => {
    const mockUser = {
        _id: "u1",
        id: "u1", // Provide both just in case
        personalInfo: { firstName: "John", lastName: "Doe" },
        email: "john@example.com",
        role: { name: "Employee" },
        employment: { designation: "Dev", department: "Engineering" }
    };

    const mockBalances = [
        {
            leaveType: { _id: "lt1", name: "Annual Leave" },
            available: 10,
            used: 2,
            total: 12
        }
    ];

    beforeEach(() => {
        jest.mocked(userService.getAll).mockResolvedValue({ users: [mockUser], total: 1, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedUserResponse);
        jest.mocked(userService.getById).mockResolvedValue(mockUser as unknown as User);
        jest.mocked(leaveService.getEmployeeBalance).mockResolvedValue({ 
            balances: mockBalances,
            userId: "u1",
            name: "John Doe",
            department: "Engineering"
        } as unknown as EmployeeLeaveBalanceResponse);
    });

    it("renders search input", () => {
        render(
            <MemoryRouter>
                <LeaveBalances />
            </MemoryRouter>
        );
        expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    });

    xit("searches and selects a user", async () => {
        render(
            <MemoryRouter>
                <LeaveBalances />
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/Search/i);
        fireEvent.change(input, { target: { value: "John" } });

        // Wait for search results - assuming 500ms debounce + render time
        await waitFor(() => {
            expect(userService.getAll).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Find by text with regex
        const userOption = await screen.findByText(/John Doe/i, {}, { timeout: 2000 });
        fireEvent.click(userOption);

        await waitFor(() => {
            expect(leaveService.getEmployeeBalance).toHaveBeenCalledWith("u1");
            expect(screen.getAllByText(/Annual Leave/i).length).toBeGreaterThan(0);
        });
    });

    it("loads user from URL", async () => {
        render(
            <MemoryRouter initialEntries={["/admin/leave-balances/u1"]}>
                <Routes>
                    <Route path="/admin/leave-balances/:userId" element={<LeaveBalances />} />
                    <Route path="/admin/leave-balances" element={<LeaveBalances />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(userService.getById).toHaveBeenCalledWith("u1");
            expect(leaveService.getEmployeeBalance).toHaveBeenCalledWith("u1");
            expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        });
    });
});

