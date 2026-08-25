import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserCreate from "./UserCreate";
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

describe("UserCreate Page", () => {
    beforeEach(() => {
        jest.mocked(userService.getById).mockResolvedValue({} as unknown as User);
        jest.mocked(locationService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<OfficeLocation>);
        jest.mocked(departmentService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<Department>);
        jest.mocked(designationService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<Designation>);
        jest.mocked(userService.getAll).mockResolvedValue({ users: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedUserResponse);
        jest.mocked(leaveTypeService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<LeaveType>);
        jest.mocked(roleService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 } as unknown as PaginatedResponse<Role>);
    });

    it("renders user form", async () => {
        render(
            <MemoryRouter>
                <UserCreate />
            </MemoryRouter>
        );

        await waitFor(() => {
            // Check for something inside UserForm (rendered by UserCreate)
            expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
        });
    });
});

