import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DepartmentForm from "./DepartmentForm";
import { jest } from "@jest/globals";

describe("DepartmentForm Component", () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
        mockOnCancel.mockClear();
    });

    it("renders correctly with initial values", () => {
        const initialValues = {
            name: "IT",
            description: "Information Technology",
            isActive: true
        };

        render(
            <DepartmentForm
                initialValues={initialValues}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByLabelText(/Department Name/i)).toHaveValue("IT");
        expect(screen.getByPlaceholderText(/Briefly describe the purpose of this department/i)).toHaveValue("Information Technology");
        expect(screen.getByLabelText(/Active/i)).toBeChecked();
    });

    it("submits the form with user input", async () => {
        render(
            <DepartmentForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        await userEvent.type(screen.getByLabelText(/Department Name/i), "Engineering");
        await userEvent.type(screen.getByPlaceholderText(/Briefly describe the purpose of this department/i), "Software Engineering");

        fireEvent.click(screen.getByRole("button", { name: /Create Department/i }));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
            const callArgs = (mockOnSubmit.mock.calls[0][0] || {}) as Record<string, unknown>;
            expect(callArgs.name).toBe("Engineering");
            expect(callArgs.description).toBe("Software Engineering");
            expect(callArgs.isActive).toBe(true);
        });
    });

    it("shows validation error when name is empty", async () => {
        render(
            <DepartmentForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /Create Department/i }));

        await waitFor(() => {
            expect(screen.getByText(/Department name is required/i)).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("calls onCancel when cancel button is clicked", async () => {
        render(
            <DepartmentForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

        expect(mockOnCancel).toHaveBeenCalled();
    });

    it("disables submit button when loading", () => {
        render(
            <DepartmentForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
                isLoading={true}
            />
        );

        expect(screen.getByRole("button", { name: /Create Department/i })).toBeDisabled();
    });
});
