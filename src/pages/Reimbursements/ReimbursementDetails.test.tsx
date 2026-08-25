import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ReimbursementDetails from "./ReimbursementDetails";
import { reimbursementService } from "../../services/reimbursementService";
import { jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import type { Reimbursement } from "../../types/reimbursement.types";

jest.mock("../../services/reimbursementService");
jest.mock("date-fns", () => ({
    format: () => "January 1st, 2024",
}));

describe("ReimbursementDetails Page", () => {
    const mockRecord = {
        _id: "reimb1",
        title: "Conference Fees",
        description: "Entry fee for tech conference",
        reimbursementType: "Education",
        amount: 10000,
        expenseDate: "2024-01-01",
        status: "pending",
        employeeId: {
            _id: "emp1",
            personalInfo: { firstName: "Alice", lastName: "Wonder" },
            employeeId: "EMP999"
        },
        createdAt: "2024-01-01",
        attachments: ["http://example.com/inv.pdf"]
    };

    beforeEach(() => {
        jest.mocked(reimbursementService.getById).mockResolvedValue({ success: true, data: mockRecord as unknown as Reimbursement });
        jest.mocked(reimbursementService.updateStatus).mockResolvedValue({ success: true, data: mockRecord as unknown as Reimbursement });
    });

    it("renders loading state initially", () => {
        render(
            <MemoryRouter initialEntries={["/reimbursements/reimb1"]}>
                <Routes>
                    <Route path="/reimbursements/:id" element={<ReimbursementDetails />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText(/Loading request details/i)).toBeInTheDocument();
    });

    it("renders details after loading", async () => {
        render(
            <MemoryRouter initialEntries={["/reimbursements/reimb1"]}>
                <Routes>
                    <Route path="/reimbursements/:id" element={<ReimbursementDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Request Details")).toBeInTheDocument();
            expect(screen.getByText("Conference Fees")).toBeInTheDocument();
            expect(screen.getAllByText(/10,000/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Alice Wonder/i).length).toBeGreaterThan(0);
        });
    });

    it("handles Approve action", async () => {
        render(
            <MemoryRouter initialEntries={["/reimbursements/reimb1"]}>
                <Routes>
                    <Route path="/reimbursements/:id" element={<ReimbursementDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Approve")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Approve"));

        // Confirmation dialog interaction
        await waitFor(() => {
            expect(screen.getByText(/Are you sure you want to approved/i)).toBeInTheDocument();
        });

        // Click confirm on dialog (assuming generic button Label from hook 'Approve')
        const confirmButtons = screen.getAllByText("Approve");
        // One is the main button, one is the dialog button. userEvent.click needs the dialog one which appears last
        fireEvent.click(confirmButtons[confirmButtons.length - 1]);

        await waitFor(() => {
            expect(reimbursementService.updateStatus).toHaveBeenCalledWith("reimb1", { status: "approved" });
        });
    });

    it("handles Reject action with reason", async () => {
        render(
            <MemoryRouter initialEntries={["/reimbursements/reimb1"]}>
                <Routes>
                    <Route path="/reimbursements/:id" element={<ReimbursementDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Reject")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Reject"));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Enter the reason for rejecting/i)).toBeInTheDocument();
        });

        await userEvent.type(screen.getByPlaceholderText(/Enter the reason for rejecting/i), "Policy violation");
        fireEvent.click(screen.getByText("Confirm Rejection"));

        // Confirmation dialog
        await waitFor(() => {
            expect(screen.getByText(/Are you sure you want to rejected/i)).toBeInTheDocument();
        });

        const rejectButtons = screen.getAllByText("Reject");
        fireEvent.click(rejectButtons[rejectButtons.length - 1]);

        await waitFor(() => {
            expect(reimbursementService.updateStatus).toHaveBeenCalledWith("reimb1", {
                status: "rejected",
                rejectionReason: "Policy violation"
            });
        });
    });
});

