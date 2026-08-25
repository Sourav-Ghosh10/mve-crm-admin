import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HolidayForm from "./HolidayForm";
import { jest } from "@jest/globals";

describe("HolidayForm Component", () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
        mockOnCancel.mockClear();
    });

    it("renders correctly with initial values", () => {
        const initialValues = {
            name: "New Year",
            date: "2024-01-01T00:00:00.000Z",
            description: "First day of the year",
            isRecurring: true,
            isActive: true
        };

        render(
            <HolidayForm
                initialValues={initialValues}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByLabelText(/Holiday Name/i)).toHaveValue("New Year");
        expect(screen.getByLabelText(/Date/i)).toHaveValue("2024-01-01");
        expect(screen.getByPlaceholderText(/Briefly describe this holiday/i)).toHaveValue("First day of the year");
        expect(screen.getByLabelText(/Annual Recurring/i)).toBeChecked();
        expect(screen.getByLabelText(/Active/i)).toBeChecked();
    });

    it("submits the form with user input", async () => {
        render(
            <HolidayForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        await userEvent.type(screen.getByLabelText(/Holiday Name/i), "Diwali");
        // For date inputs, sometimes value change is better than userEvent.type
        fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: "2024-11-01" } });
        await userEvent.type(screen.getByPlaceholderText(/Briefly describe this holiday/i), "Festival of lights");

        fireEvent.click(screen.getByRole("button", { name: /Create Holiday/i }));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
            const callArgs = (mockOnSubmit.mock.calls[0][0] || {}) as Record<string, unknown>;
            expect(callArgs.name).toBe("Diwali");
            expect(callArgs.date).toBe("2024-11-01");
            expect(callArgs.description).toBe("Festival of lights");
        });
    });

    it("shows validation error when name is empty", async () => {
        render(
            <HolidayForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /Create Holiday/i }));

        await waitFor(() => {
            expect(screen.getByText(/Holiday name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/Date is required/i)).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });
});
