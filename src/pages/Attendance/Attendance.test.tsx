import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../store/slices/authSlice";
import type { User } from "../../types/user.types";
import type { AuthState } from "../../store/slices/authSlice";
import type { Department, Designation, PaginatedResponse } from "../../types/organization.types";
import type { Attendance as AttendanceType } from "../../types/attendance.types";
import Attendance from "./Attendance";
import { attendanceService } from "../../services/attendanceService";
import { departmentService } from "../../services/departmentService";
import { designationService } from "../../services/designationService";
import { jest } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";

jest.mock("../../services/attendanceService");
jest.mock("../../services/departmentService");
jest.mock("../../services/designationService");

const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            auth: authReducer
        },
        preloadedState: {
            auth: {
                user: { _id: "admin1", isAdmin: true } as unknown as User,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                error: null,
                ...initialState
            } as unknown as AuthState
        }
    });
};

describe("Attendance Page", () => {
    beforeEach(() => {
        jest.mocked(attendanceService.getAll).mockResolvedValue({
            attendances: [],
            total: 0,
            totalPages: 1,
            page: 1,
            limit: 10
        } as unknown as { attendances: AttendanceType[], total: number, totalPages: number, page: number, limit: number });
        jest.mocked(departmentService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<Department>);
        jest.mocked(designationService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<Designation>);
    });

    it("renders attendance page", async () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Attendance />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/Loading Attendance Records/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Attendance Log/i)).toBeInTheDocument();
        });
    });

    it("shows search input and filters", async () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Attendance />
                </MemoryRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search by employee name/i)).toBeInTheDocument();
        });
    });
});

