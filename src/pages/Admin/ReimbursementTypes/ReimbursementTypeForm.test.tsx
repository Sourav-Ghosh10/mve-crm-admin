import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReimbursementTypeForm from "./ReimbursementTypeForm";
import { jest } from "@jest/globals";

describe("ReimbursementTypeForm Component", () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
        mockOnCancel.mockClear();
    });

    it("renders correctly with initial values", () => {
        const initialValues = {
            name: "Travel Expenses",
            description: "For business travel",
            maxAmount: 500,
            requiresReceipt: true,
            isActive: true
        };

        render(
            <ReimbursementTypeForm
                initialValues={initialValues}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByLabelText(/Type Name/i)).toHaveValue("Travel Expenses");
        expect(screen.getByLabelText(/Max Amount/i)).toHaveValue(500);
        expect(screen.getByPlaceholderText(/Briefly describe this reimbursement type/i)).toHaveValue("For business travel");
    });

    it("submits the form with user input", async () => {
        render(
            <ReimbursementTypeForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        await userEvent.type(screen.getByLabelText(/Type Name/i), "Meals");
        await userEvent.type(screen.getByLabelText(/Max Amount/i), "100");
        await userEvent.type(screen.getByPlaceholderText(/Briefly describe this reimbursement type/i), "Daily meal allowance");

        fireEvent.click(screen.getByRole("button", { name: /Create Type/i }));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
            const callArgs = (mockOnSubmit.mock.calls[0][0] || {}) as Record<string, unknown>;
            expect(callArgs.name).toBe("Meals");
            expect(callArgs.maxAmount).toBe(100);
        });
    });

    it("shows validation error when name is empty", async () => {
        render(
            <ReimbursementTypeForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /Create Type/i }));

        await waitFor(() => {
            expect(screen.getByText(/Reimbursement type name is required/i)).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("calls onCancel when cancel button is clicked", () => {
        render(
            <ReimbursementTypeForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

        expect(mockOnCancel).toHaveBeenCalled();
    });
});
