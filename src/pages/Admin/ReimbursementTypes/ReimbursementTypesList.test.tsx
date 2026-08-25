import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReimbursementTypesList from "./ReimbursementTypesList";
import { reimbursementTypeService } from "../../../services/reimbursementTypeService";
import { jest } from "@jest/globals";
import type { ReimbursementType } from "../../../types/reimbursement.types";
import type { PaginatedResponse } from "../../../types/organization.types";

jest.mock("../../../services/reimbursementTypeService");

describe("ReimbursementTypesList Page", () => {
    beforeEach(() => {
        jest.mocked(reimbursementTypeService.getAll).mockResolvedValue({
            data: [
                { _id: "1", name: "Travel", description: "Travel expenses", isActive: true, requiresReceipt: true },
                { _id: "2", name: "Meals", description: "Meal expenses", isActive: true, requiresReceipt: true }
            ],
            total: 2,
            totalPages: 1,
            page: 1,
            limit: 10
        } as unknown as PaginatedResponse<ReimbursementType>);
    });

    it("renders loading state initially", () => {
        render(
            <MemoryRouter>
                <ReimbursementTypesList />
            </MemoryRouter>
        );

        expect(screen.getByText(/Loading Reimbursement Types/i)).toBeInTheDocument();
    });

    it("renders reimbursement types list after loading", async () => {
        render(
            <MemoryRouter>
                <ReimbursementTypesList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Reimbursement Types")).toBeInTheDocument();
            expect(screen.getByText("Travel")).toBeInTheDocument();
            expect(screen.getByText("Meals")).toBeInTheDocument();
        });
    });

    it("shows Add Reimbursement Type button", async () => {
        render(
            <MemoryRouter>
                <ReimbursementTypesList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Add Reimbursement Type/i })).toBeInTheDocument();
        });
    });

    it("shows search input", async () => {
        render(
            <MemoryRouter>
                <ReimbursementTypesList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search types.../i)).toBeInTheDocument();
        });
    });
});

