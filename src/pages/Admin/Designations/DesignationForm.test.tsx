import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesignationForm from "./DesignationForm";
import { jest } from "@jest/globals";

describe("DesignationForm Component", () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
        mockOnCancel.mockClear();
    });

    it("renders correctly with initial values", () => {
        const initialValues = {
            title: "Senior Developer",
            description: "Builds cool stuff",
            isActive: true
        };

        render(
            <DesignationForm
                initialValues={initialValues}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByLabelText(/Designation Title/i)).toHaveValue("Senior Developer");
        expect(screen.getByPlaceholderText(/Detail the responsibilities of this role/i)).toHaveValue("Builds cool stuff");
        expect(screen.getByLabelText(/Active/i)).toBeChecked();
    });

    it("submits the form with user input", async () => {
        render(
            <DesignationForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        await userEvent.type(screen.getByLabelText(/Designation Title/i), "Lead Engineer");
        await userEvent.type(screen.getByPlaceholderText(/Detail the responsibilities of this role/i), "Leads engineeing team");

        fireEvent.click(screen.getByRole("button", { name: /Create Designation/i }));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
            const callArgs = (mockOnSubmit.mock.calls[0][0] || {}) as Record<string, unknown>;
            expect(callArgs.title).toBe("Lead Engineer");
            expect(callArgs.description).toBe("Leads engineeing team");
            expect(callArgs.isActive).toBe(true);
        });
    });

    it("shows validation error when title is empty", async () => {
        render(
            <DesignationForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /Create Designation/i }));

        await waitFor(() => {
            expect(screen.getByText(/Archetype title is required/i)).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("calls onCancel when cancel button is clicked", async () => {
        render(
            <DesignationForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

        expect(mockOnCancel).toHaveBeenCalled();
    });
});
