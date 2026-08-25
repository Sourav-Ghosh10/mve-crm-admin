import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DepartmentsList from "./DepartmentsList";
import { departmentService } from "../../../services/departmentService";
import { jest } from "@jest/globals";

jest.mock("../../../services/departmentService");

describe("DepartmentsList Page", () => {
    beforeEach(() => {
        jest.mocked(departmentService.getAll).mockResolvedValue({
            data: [
                { _id: "1", id: "1", name: "Engineering", description: "Software team", isActive: true },
                { _id: "2", id: "2", name: "HR", description: "Human resources", isActive: false }
            ],
            total: 2,
            totalPages: 1,
            page: 1,
            limit: 10
        });
    });

    it("renders loading state initially", () => {
        render(
            <MemoryRouter>
                <DepartmentsList />
            </MemoryRouter>
        );

        expect(screen.getByText(/Accessing Division Matrix/i)).toBeInTheDocument();
    });

    it("renders departments list after loading", async () => {
        render(
            <MemoryRouter>
                <DepartmentsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Departments" })).toBeInTheDocument();
            expect(screen.getByText("Engineering")).toBeInTheDocument();
            expect(screen.getByText("HR")).toBeInTheDocument();
        });
    });

    it("shows Add Department button", async () => {
        render(
            <MemoryRouter>
                <DepartmentsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Add Department/i })).toBeInTheDocument();
        });
    });

    it("shows search input", async () => {
        render(
            <MemoryRouter>
                <DepartmentsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search departments/i)).toBeInTheDocument();
        });
    });
});
