import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../store/slices/authSlice";
import Login from "./Login";
import type { AuthState } from "../../store/slices/authSlice";

// Create a mock store
const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            auth: authReducer
        },
        preloadedState: {
            auth: {
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
                error: null,
                ...initialState
            } as unknown as AuthState
        }
    });
};

describe("Login Page", () => {
    it("renders login form correctly", () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
        const submitButton = signInButtons.find(btn => btn.getAttribute("type") === "submit");
        expect(submitButton).toBeInTheDocument();
    });

    it("shows validation errors for empty fields", async () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </Provider>
        );

        const signInButtons = screen.getAllByRole("button", { name: /Sign In/i });
        const submitButton = signInButtons.find(btn => btn.getAttribute("type") === "submit");
        fireEvent.click(submitButton!);

        await waitFor(() => {
            expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
            expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
        });
    });

    it("shows loading state when submitting", () => {
        const store = createMockStore({ isLoading: true });
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/Signing in/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Signing in/i })).toBeDisabled();
    });

    it("displays error message from store", () => {
        const store = createMockStore({ error: "Invalid credentials" });
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
});
