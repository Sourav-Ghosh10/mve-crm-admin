import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LocationForm from "./LocationForm";
import { jest } from "@jest/globals";

describe("LocationForm Component", () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
        mockOnCancel.mockClear();
    });

    it("renders correctly with initial values", () => {
        const initialValues = {
            name: "Mumbai HQ",
            address: {
                street: "123 Tech St",
                city: "Mumbai",
                state: "Maharashtra",
                country: "India",
                zipCode: "400001"
            },
            contactInfo: {
                phone: "1234567890",
                email: "hq@example.com"
            },
            isHeadquarters: true,
            isActive: true,
            timezone: "Asia/Kolkata"
        };

        render(
            <LocationForm
                initialValues={initialValues}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByLabelText(/Location Name/i)).toHaveValue("Mumbai HQ");
        expect(screen.getByLabelText(/Street Address/i)).toHaveValue("123 Tech St");
        expect(screen.getByLabelText(/City/i)).toHaveValue("Mumbai");
        expect(screen.getByLabelText(/Headquarters/i)).toBeChecked();
    });

    it("submits the form with user input", async () => {
        render(
            <LocationForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        await userEvent.type(screen.getByLabelText(/Location Name/i), "Bangalore Branch");
        await userEvent.type(screen.getByLabelText(/Street Address/i), "456 Silicon Ave");
        await userEvent.type(screen.getByLabelText(/City/i), "Bangalore");
        await userEvent.type(screen.getByLabelText(/State/i), "Karnataka");
        await userEvent.type(screen.getByLabelText(/ZIP Code/i), "560001");

        fireEvent.click(screen.getByRole("button", { name: /Create/i }));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        });
    });

    it("shows validation error when required fields are missing", async () => {
        render(
            <LocationForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /Create/i }));

        await waitFor(() => {
            expect(screen.getByText(/Location name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/Street is required/i)).toBeInTheDocument();
            expect(screen.getByText(/City is required/i)).toBeInTheDocument();
        });
    });
});
