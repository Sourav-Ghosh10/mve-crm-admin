import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RolesList from "./RolesList";
import { roleService } from "../../../services/roleService";
import { jest } from "@jest/globals";
import type { Role } from "../../../types/role.types";
import type { PaginatedResponse } from "../../../types/organization.types";

jest.mock("../../../services/roleService");

describe("RolesList Page", () => {
    beforeEach(() => {
        jest.mocked(roleService.getAll).mockResolvedValue({
            data: [
                { _id: "1", name: "Admin", description: "Full access", isActive: true, permissions: ["all"] } as unknown as Role,
                { _id: "2", name: "User", description: "Basic access", isActive: true, permissions: [] } as unknown as Role
            ],
            total: 2,
            totalPages: 1,
            page: 1,
            limit: 10
        } as unknown as PaginatedResponse<Role>);
    });

    it("renders loading state initially", () => {
        render(
            <MemoryRouter>
                <RolesList />
            </MemoryRouter>
        );

        expect(screen.getByText(/Accessing Role Protocol/i)).toBeInTheDocument();
    });

    it("renders roles list after loading", async () => {
        render(
            <MemoryRouter>
                <RolesList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Roles" })).toBeInTheDocument();
            expect(screen.getByText("Admin")).toBeInTheDocument();
            expect(screen.getByText("User")).toBeInTheDocument();
        });
    });

    it("shows Create Role button", async () => {
        render(
            <MemoryRouter>
                <RolesList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Create Role/i })).toBeInTheDocument();
        });
    });

    it("shows search input", async () => {
        render(
            <MemoryRouter>
                <RolesList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search roles/i)).toBeInTheDocument();
        });
    });
});

