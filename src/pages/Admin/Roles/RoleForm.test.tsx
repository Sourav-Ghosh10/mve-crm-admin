import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoleForm from "./RoleForm";
import { jest } from "@jest/globals";

describe("RoleForm Component", () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
        mockOnCancel.mockClear();
    });

    it("renders correctly with initial values", () => {
        const initialValues = {
            name: "Admin",
            description: "Full access",
            isActive: true
        };

        render(
            <RoleForm
                initialValues={initialValues}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByLabelText(/Role Name/i)).toHaveValue("Admin");
        expect(screen.getByPlaceholderText(/Briefly describe the responsibilities of this role/i)).toHaveValue("Full access");
        expect(screen.getByLabelText(/Active/i)).toBeChecked();
    });

    it("submits the form with user input", async () => {
        render(
            <RoleForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        await userEvent.type(screen.getByLabelText(/Role Name/i), "Manager");
        await userEvent.type(screen.getByPlaceholderText(/Briefly describe the responsibilities of this role/i), "Team management");

        fireEvent.click(screen.getByRole("button", { name: /Create Role/i }));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
            const callArgs = (mockOnSubmit.mock.calls[0][0] || {}) as Record<string, unknown>;
            expect(callArgs.name).toBe("Manager");
            expect(callArgs.description).toBe("Team management");
            expect(callArgs.isActive).toBe(true);
        });
    });

    it("shows validation error when name is empty", async () => {
        render(
            <RoleForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /Create Role/i }));

        await waitFor(() => {
            expect(screen.getByText(/Role name is required/i)).toBeInTheDocument();
        });
    });
});
