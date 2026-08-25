import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Mock authService
jest.mock("../../services/authService", () => ({
    authService: {
        isAuthenticated: jest.fn().mockReturnValue(true),
        logout: jest.fn(),
        getCurrentUser: jest.fn(),
    }
}));
// Mock useAppSelector before importing the component
// Mock authSlice to avoid side effects
jest.mock("../../store/slices/authSlice", () => ({
    fetchCurrentUser: jest.fn(),
}));

jest.mock("../../store/hooks", () => ({
    useAppSelector: jest.fn(() => ({ isAuthenticated: false, isInitialized: true, user: null })),
    useAppDispatch: jest.fn(() => jest.fn()),
}));

import { useAppSelector } from "../../store/hooks";

const mockUseAppSelector = useAppSelector as jest.Mock;

// Mock authSlice to avoid side effects
jest.mock("../../store/slices/authSlice", () => ({
    fetchCurrentUser: jest.fn(),
}));

describe("ProtectedRoute", () => {
    it("renders children when authenticated", () => {
        // Mock authentication state as true
        mockUseAppSelector.mockReturnValue({ isAuthenticated: true, isInitialized: true });

        render(
            <MemoryRouter initialEntries={["/protected"]}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute>
                                <div>Protected Content</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("redirects to login when not authenticated", () => {
        // Mock authentication state as false
        mockUseAppSelector.mockReturnValue({ isAuthenticated: false });

        render(
            <MemoryRouter initialEntries={["/protected"]}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute>
                                <div>Protected Content</div>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Login Page")).toBeInTheDocument();
        expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
});
