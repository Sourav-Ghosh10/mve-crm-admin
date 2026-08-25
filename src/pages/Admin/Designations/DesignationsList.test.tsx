import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DesignationsList from "./DesignationsList";
import { designationService } from "../../../services/designationService";
import { departmentService } from "../../../services/departmentService";
import { jest } from "@jest/globals";

jest.mock("../../../services/designationService");
jest.mock("../../../services/departmentService");

describe("DesignationsList Page", () => {
    beforeEach(() => {
        jest.mocked(designationService.getAll).mockResolvedValue({
            data: [
                { _id: "1", title: "Senior Developer", description: "Builds software", isActive: true },
                { _id: "2", title: "Manager", description: "Manages team", isActive: false }
            ],
            total: 2,
            totalPages: 1,
            page: 1,
            limit: 10
        });
        jest.mocked(departmentService.getAll).mockResolvedValue({
            data: [],
            total: 0,
            totalPages: 0,
            page: 1,
            limit: 10
        });
    });

    it("renders loading state initially", () => {
        render(
            <MemoryRouter>
                <DesignationsList />
            </MemoryRouter>
        );

        expect(screen.getByText(/Initializing Archetypes/i)).toBeInTheDocument();
    });

    it("renders designations list after loading", async () => {
        render(
            <MemoryRouter>
                <DesignationsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Designations")).toBeInTheDocument();
            expect(screen.getByText("Senior Developer")).toBeInTheDocument();
            expect(screen.getByText("Manager")).toBeInTheDocument();
        });
    });

    it("shows Add Designation button", async () => {
        render(
            <MemoryRouter>
                <DesignationsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Add Designation/i })).toBeInTheDocument();
        });
    });

    it("shows search input", async () => {
        render(
            <MemoryRouter>
                <DesignationsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search designations/i)).toBeInTheDocument();
        });
    });
});

