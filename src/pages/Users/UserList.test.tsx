import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserList from "./UserList";
import { userService } from "../../services/userService";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...(jest.requireActual("react-router-dom") as Record<string, unknown>),
    useNavigate: () => mockNavigate,
}));

// Mock GlobalLoader to avoid animation issues in tests
jest.mock("../../components/common/LoadingSpinner/GlobalLoader", () => () => <div data-testid="global-loader">Loading...</div>);

// Mock Child Components to simplify search test
jest.mock("../../components/common/Modal", () => {
    return ({ children, open, title }: { children: React.ReactNode; open: boolean; title: string }) => {
        if (!open) return null;
        return (
            <div role="dialog" aria-label={title}>
                <h2>{title}</h2>
                {children}
            </div>
        );
    };
});

// Mock hooks
jest.mock("../../hooks/useDebounce", () => ({
    useDebounce: (value: unknown) => value,
}));

jest.mock("../../services/departmentService", () => ({
    departmentService: {
        getAll: jest.fn(() => Promise.resolve({
            data: [],
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 1
        })),
    },
}));

const mockUsers = [
    {
        id: "1",
        _id: "1",
        isAdmin: true,
        employeeId: "EMP001",
        username: "john_admin",
        personalInfo: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@pulseops.com",
            phone: "+1234567890",
        },
        employment: {
            role: "admin" as const,
            department: "Management",
            designation: "System Administrator",
            dateOfJoining: "2023-01-15",
            employmentType: "full-time" as const,
            workingHours: {
                startTime: "09:00",
                endTime: "18:00",
                weeklyOff: ["Saturday", "Sunday"],
            },
        },
        permissions: {
            modules: ["all"],
            canApproveLeave: true,
            canApproveReimbursement: true,
            canManageSchedule: true,
            canViewReports: true,
        },
        allowedIPs: [],
        leaveBalance: {
            casual: 12,
            sick: 10,
            earned: 15,
            compOff: 0,
        },
        isActive: true,
        failedLoginAttempts: 0,
    },
    {
        id: "2",
        _id: "2",
        isAdmin: false,
        employeeId: "EMP002",
        username: "jane_hr",
        personalInfo: {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@pulseops.com",
            phone: "+1234567891",
        },
        employment: {
            role: "hr" as const,
            department: "Human Resources",
            designation: "HR Manager",
            dateOfJoining: "2023-03-10",
            employmentType: "full-time" as const,
            workingHours: {
                startTime: "09:00",
                endTime: "18:00",
                weeklyOff: ["Saturday", "Sunday"],
            },
        },
        permissions: {
            modules: ["hr", "attendance"],
            canApproveLeave: true,
            canApproveReimbursement: false,
            canManageSchedule: true,
            canViewReports: true,
        },
        allowedIPs: [],
        leaveBalance: {
            casual: 12,
            sick: 10,
            earned: 15,
            compOff: 0,
        },
        isActive: true,
        failedLoginAttempts: 0,
    }
];

describe("UserList Page", () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        jest.spyOn(userService, 'getAll').mockImplementation(async (params) => {
            const { search } = params || {};
            let filteredUsers = [...mockUsers];

            if (search) {
                const searchLower = search.toLowerCase();
                filteredUsers = filteredUsers.filter(user =>
                    user.personalInfo.firstName.toLowerCase().includes(searchLower) ||
                    user.personalInfo.lastName.toLowerCase().includes(searchLower) ||
                    user.employeeId.toLowerCase().includes(searchLower)
                );
            }

            return {
                users: filteredUsers as unknown as import("../../types/user.types").User[],
                total: filteredUsers.length,
                totalPages: 1,
                page: 1,
                limit: 10
            };
        });

        jest.spyOn(userService, 'delete').mockResolvedValue(undefined);
        jest.spyOn(userService, 'create').mockResolvedValue({} as unknown as import("../../types/user.types").User);
        jest.spyOn(userService, 'update').mockResolvedValue({} as unknown as import("../../types/user.types").User);
    });

    it("renders user list title", async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <UserList />
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText("User Directory")).toBeInTheDocument();
        });
    });

    it("renders search input", async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <UserList />
                </MemoryRouter>
            );
        });
        expect(screen.getByPlaceholderText("Search name, ID...")).toBeInTheDocument();
    });

    it("renders user table with fetched data", async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <UserList />
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText("John Doe")).toBeInTheDocument();
            expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        });
    });

    it("filters users when searching", async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <UserList />
                </MemoryRouter>
            );
        });

        await waitFor(() => expect(screen.getByText("John Doe")).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText("Search name, ID...");
        fireEvent.change(searchInput, { target: { value: "John" } });

        await waitFor(() => {
            expect(userService.getAll).toHaveBeenCalledWith(expect.objectContaining({ search: "John" }));
        });

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });

    it("navigates to create user page when onboard button clicked", async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <UserList />
                </MemoryRouter>
            );
        });

        await waitFor(() => expect(screen.queryByTestId("global-loader")).not.toBeInTheDocument());

        const addButton = screen.getByRole("button", { name: /onboard talent/i });
        fireEvent.click(addButton);

        expect(mockNavigate).toHaveBeenCalledWith("/users/create");
    });
});
