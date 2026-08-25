import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UserEdit from "./UserEdit";
import { userService } from "../../services/userService";
import { locationService } from "../../services/locationService";
import { departmentService } from "../../services/departmentService";
import { designationService } from "../../services/designationService";
import { roleService } from "../../services/roleService";
import { leaveTypeService } from "../../services/leaveTypeService";
import { jest } from "@jest/globals";
import type { User, PaginatedUserResponse } from "../../types/user.types";
import type { OfficeLocation, Department, Designation, PaginatedResponse, LeaveType } from "../../types/organization.types";
import type { Role } from "../../types/role.types";

jest.mock("../../services/userService");
jest.mock("../../services/locationService");
jest.mock("../../services/departmentService");
jest.mock("../../services/designationService");
jest.mock("../../services/roleService");
jest.mock("../../services/leaveTypeService");

describe("UserEdit Page", () => {
    const mockUser = {
        _id: "123",
        personalInfo: { firstName: "John", lastName: "Doe", email: "john@example.com" },
        employment: { role: "admin", department: "IT", designation: "Developer", dateOfJoining: "2023-01-01", employmentType: "full-time" },
        permissions: { modules: [], canApproveLeave: false, canApproveReimbursement: false, canManageSchedule: false, canViewReports: false },
        isActive: true
    };

    beforeEach(() => {
        jest.mocked(userService.getById).mockResolvedValue(mockUser as unknown as User);
        jest.mocked(locationService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<OfficeLocation>);
        jest.mocked(departmentService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<Department>);
        jest.mocked(designationService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<Designation>);
        jest.mocked(userService.getAll).mockResolvedValue({ users: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedUserResponse);
        jest.mocked(leaveTypeService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<LeaveType>);
        jest.mocked(roleService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<Role>);
    });

    it("renders loading state then user form", async () => {
        render(
            <MemoryRouter initialEntries={["/users/123/edit"]}>
                <Routes>
                    <Route path="/users/:id/edit" element={<UserEdit />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/Loading Personnel File/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Modify Record/i)).toBeInTheDocument();
            expect(screen.getByText(/Updating profile for John Doe/i)).toBeInTheDocument();
        });
    });

    it("shows error message when user not found", async () => {
        jest.mocked(userService.getById).mockResolvedValue(null as unknown as User);

        render(
            <MemoryRouter initialEntries={["/users/999/edit"]}>
                <Routes>
                    <Route path="/users/:id/edit" element={<UserEdit />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Employee Not Found/i)).toBeInTheDocument();
        });
    });
});

