import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../store/slices/authSlice";
import Leave from "./Leave";
import { leaveService } from "../../services/leaveService";
import { jest } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import type { User } from "../../types/user.types";
import type { AuthState } from "../../store/slices/authSlice";
import type { LeaveRequest } from "../../types/leave.types";

jest.mock("../../services/leaveService");

const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            auth: authReducer
        },
        preloadedState: {
            auth: {
                user: { _id: "admin1", isAdmin: true, permissions: { canApproveLeave: true } } as unknown as User,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                error: null,
                ...initialState
            } as unknown as AuthState
        }
    });
};

describe("Leave Page", () => {
    beforeEach(() => {
        jest.mocked(leaveService.getStats).mockResolvedValue({
            pendingApprovals: 5,
            approvedToday: 2,
            rejectedTotal: 1,
            totalRequests: 10
        } as unknown as { pendingApprovals: number, approvedToday: number, rejectedTotal: number, totalRequests: number });
        jest.mocked(leaveService.getRequests).mockResolvedValue({
            data: [],
            pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
            success: true
        } as unknown as { data: LeaveRequest[], pagination: { total: number, page: number, limit: number, totalPages: number }, success: boolean });
    });

    it("renders leave page and stats", async () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Leave />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/Loading Leave Approvals/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Leave Approvals/i)).toBeInTheDocument();
            expect(screen.getByText("5")).toBeInTheDocument(); // pendingApprovals
            expect(screen.getByText("2")).toBeInTheDocument(); // approvedToday
        });
    });

    it("shows empty state when no requests", async () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Leave />
                </MemoryRouter>
            </Provider>
        );

        await waitFor(() => {
            const noRequestsElements = screen.getAllByText(/No Leave Requests/i);
            expect(noRequestsElements.length).toBeGreaterThan(0);
        });
    });
});

