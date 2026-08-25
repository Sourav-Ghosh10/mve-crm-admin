import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LeaveTypesList from "./LeaveTypesList";
import { leaveTypeService } from "../../../services/leaveTypeService";
import { jest } from "@jest/globals";
import type { LeaveType, PaginatedResponse } from "../../../types/organization.types";

jest.mock("../../../services/leaveTypeService");

describe("LeaveTypesList Page", () => {
    beforeEach(() => {
        jest.mocked(leaveTypeService.getAll).mockResolvedValue({
            data: [
                {
                    _id: "1",
                    name: "Annual Leave",
                    code: "AL",
                    isActive: true,
                    isPaid: true,
                    defaultAmount: 20,
                    resetFrequency: "yearly",
                    maxCarryForward: 5,
                    applicableDepartments: ["all"],
                    applicableDesignations: ["all"]
                },
                {
                    _id: "2",
                    name: "Sick Leave",
                    code: "SL",
                    isActive: true,
                    isPaid: true,
                    defaultAmount: 10,
                    resetFrequency: "yearly",
                    maxCarryForward: 0,
                    applicableDepartments: ["all"],
                    applicableDesignations: ["all"]
                }
            ],
            total: 2,
            totalPages: 1,
            page: 1,
            limit: 10
        } as unknown as PaginatedResponse<LeaveType>);
    });

    it("renders loading state initially", () => {
        render(
            <MemoryRouter>
                <LeaveTypesList />
            </MemoryRouter>
        );

        expect(screen.getByText(/Loading Leave Types/i)).toBeInTheDocument();
    });

    it("renders leave types list after loading", async () => {
        render(
            <MemoryRouter>
                <LeaveTypesList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Leave Types")).toBeInTheDocument();
            expect(screen.getByText("Annual Leave")).toBeInTheDocument();
            expect(screen.getByText("Sick Leave")).toBeInTheDocument();
        });
    });

    it("shows Add Leave Type button", async () => {
        render(
            <MemoryRouter>
                <LeaveTypesList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Add Leave Type/i })).toBeInTheDocument();
        });
    });

    it("shows search input", async () => {
        render(
            <MemoryRouter>
                <LeaveTypesList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Search leave types/i)).toBeInTheDocument();
        });
    });
});

