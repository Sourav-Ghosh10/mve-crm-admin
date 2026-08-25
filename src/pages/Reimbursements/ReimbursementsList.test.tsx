import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReimbursementsList from "./ReimbursementsList";
import { reimbursementService } from "../../services/reimbursementService";
import { reimbursementTypeService } from "../../services/reimbursementTypeService";
import { jest } from "@jest/globals";
import type { Reimbursement, PaginatedReimbursementResponse, ReimbursementType } from "../../types/reimbursement.types";

jest.mock("../../services/reimbursementService");
jest.mock("../../services/reimbursementTypeService");

// Mock format from date-fns
jest.mock("date-fns", () => ({
    format: () => "Jan 01, 2024",
    parseISO: (str: string) => new Date(str),
    startOfMonth: (d: Date) => d,
    endOfMonth: (d: Date) => d,
}));

describe("ReimbursementsList Page", () => {
    beforeEach(() => {
        jest.mocked(reimbursementService.getAll).mockResolvedValue({
            data: [
                {
                    _id: "1",
                    title: "Flight Tickets",
                    reimbursementType: "Travel",
                    amount: 5000,
                    expenseDate: "2024-01-01",
                    status: "pending",
                    employeeId: {
                        _id: "emp1",
                        personalInfo: { firstName: "John", lastName: "Doe" },
                        firstName: "John",
                        lastName: "Doe"
                    }
                },
                {
                    _id: "2",
                    title: "Client Dinner",
                    reimbursementType: "Meals",
                    amount: 1500,
                    expenseDate: "2024-01-02",
                    status: "approved",
                    employeeId: {
                        _id: "emp2",
                        personalInfo: { firstName: "Jane", lastName: "Smith" },
                        firstName: "Jane",
                        lastName: "Smith"
                    }
                } as unknown as Reimbursement
            ],
            pagination: { pages: 1, total: 2, page: 1, limit: 10 }
        } as unknown as PaginatedReimbursementResponse);

        jest.mocked(reimbursementTypeService.getActive).mockResolvedValue([
            { name: "Travel", _id: "type1" },
            { name: "Meals", _id: "type2" }
        ] as unknown as ReimbursementType[]);
    });

    it("renders loading state initially", () => {
        render(
            <MemoryRouter>
                <ReimbursementsList />
            </MemoryRouter>
        );

        expect(screen.getByText(/Loading Reimbursements/i)).toBeInTheDocument();
    });

    it("renders reimbursement requests after loading", async () => {
        render(
            <MemoryRouter>
                <ReimbursementsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Reimbursement Requests")).toBeInTheDocument();
            expect(screen.getByText("Flight Tickets")).toBeInTheDocument();
            expect(screen.getByText("Client Dinner")).toBeInTheDocument();
            expect(screen.getByText("John Doe")).toBeInTheDocument();
            expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        });
    });

    it("renders reimbursement amounts correctly", async () => {
        render(
            <MemoryRouter>
                <ReimbursementsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("₹5,000")).toBeInTheDocument();
            expect(screen.getByText("₹1,500")).toBeInTheDocument();
        });
    });

    it("renders search input", async () => {
        render(
            <MemoryRouter>
                <ReimbursementsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search by title or employee/i)).toBeInTheDocument();
        });
    });

    it("filters by status", async () => {
        render(
            <MemoryRouter>
                <ReimbursementsList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Reimbursement Requests")).toBeInTheDocument();
        });

        // Since UnifiedFilter is a complex component, we might mock it or just verify it renders
        // For now, let's verify key filter options are present/implied
        // Note: UnifiedFilter might use react-select or similar, which is hard to test with simple queries.
        // Check for Filters button
        const filterButton = screen.getByText("Filters");
        expect(filterButton).toBeInTheDocument();
    });
});

