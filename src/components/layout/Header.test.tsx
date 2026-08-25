import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";

// Mock hooks
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

jest.mock("../../store/hooks", () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: () => ({
        user: {
            personalInfo: {
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com"
            }
        }
    }),
}));

// Mock authService to prevent firebase initialization which uses import.meta
jest.mock("../../services/authService", () => ({
    authService: {
        logout: jest.fn(),
        isAuthenticated: jest.fn().mockReturnValue(true),
    }
}));

// Mock import.meta.env for Jest

// Mock import.meta.env for Jest
jest.mock("../../services/api", () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
        get: jest.fn(),
    },
    tokenStorage: {
        getAccessToken: jest.fn(),
        getRefreshToken: jest.fn(),
        setTokens: jest.fn(),
        clearTokens: jest.fn(),
    },
}));

describe("Header Component", () => {
    const handleDrawerToggleMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders logo and title", () => {
        render(
            <MemoryRouter>
                <Header handleDrawerToggle={handleDrawerToggleMock} />
            </MemoryRouter>
        );
        expect(screen.getByText("Pulse Ops")).toBeInTheDocument();
    });

    it("renders user initials", () => {
        render(
            <MemoryRouter>
                <Header handleDrawerToggle={handleDrawerToggleMock} />
            </MemoryRouter>
        );
        expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("opens user dropdown on click", () => {
        render(
            <MemoryRouter>
                <Header handleDrawerToggle={handleDrawerToggleMock} />
            </MemoryRouter>
        );

        // Click the button containing JD or the User string
        const userButton = screen.getByText("JD").closest("button");
        fireEvent.click(userButton!);

        expect(screen.getByText("My Profile")).toBeInTheDocument();
        expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });

    it("calls logout when sign out clicked", () => {
        render(
            <MemoryRouter>
                <Header handleDrawerToggle={handleDrawerToggleMock} />
            </MemoryRouter>
        );

        const userButton = screen.getByText("JD").closest("button");
        fireEvent.click(userButton!);

        const logoutButton = screen.getByText("Sign Out");
        fireEvent.click(logoutButton);

        expect(mockDispatch).toHaveBeenCalled();
    });
});
