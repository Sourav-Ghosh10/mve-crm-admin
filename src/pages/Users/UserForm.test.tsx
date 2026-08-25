import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserForm from "./UserForm";
import userEvent from "@testing-library/user-event";
import type { OfficeLocation, Department, Designation } from "../../types/organization.types";

describe("UserForm Component", () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    const mockLocations: Partial<OfficeLocation>[] = [
        { _id: "loc1", name: "Main Office", isActive: true }
    ];
    const mockDepartments: Partial<Department>[] = [
        { _id: "dept1", name: "IT", isActive: true }
    ];
    const mockDesignations: Partial<Designation>[] = [
        { _id: "desig1", title: "Developer", department: { _id: "dept1", name: "IT" }, isActive: true }
    ];

    beforeEach(() => {
        mockOnSubmit.mockClear();
        mockOnCancel.mockClear();
    });

    it("renders form fields correctly through steps", async () => {
        render(
            <UserForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
                locations={mockLocations as OfficeLocation[]}
                departments={mockDepartments as Department[]}
                designations={mockDesignations as Designation[]}
            />
        );

        // Step 1
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Email Address")).toBeInTheDocument();

        // Fill Step 1 and go to Step 2
        await userEvent.type(screen.getByLabelText("First Name"), "John");
        await userEvent.type(screen.getByLabelText("Last Name"), "Doe");
        await userEvent.type(screen.getByLabelText("Email Address"), "john@example.com");
        await userEvent.type(screen.getByLabelText("Employee ID"), "EMP001");
        await userEvent.type(screen.getByLabelText("Username"), "johndoe");
        await userEvent.type(screen.getByLabelText("Password"), "Password123!");

        const nextButton = screen.getByRole("button", { name: /next/i });
        fireEvent.click(nextButton);

        // Step 2
        await waitFor(() => {
            expect(screen.getByLabelText("Role")).toBeInTheDocument();
        });
        expect(screen.getByLabelText("Department")).toBeInTheDocument();
        expect(screen.getByLabelText("Designation")).toBeInTheDocument();
    });

    it("validates required fields in Step 1", async () => {
        render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

        const nextButton = screen.getByRole("button", { name: /next/i });
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText("First name is required")).toBeInTheDocument();
        });
        expect(screen.getByText("Last name is required")).toBeInTheDocument();
        expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    it("submits form with valid data through all steps", async () => {
        render(
            <UserForm
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
                locations={mockLocations as OfficeLocation[]}
                departments={mockDepartments as Department[]}
                designations={mockDesignations as Designation[]}
            />
        );

        // Step 1
        await userEvent.type(screen.getByLabelText("First Name"), "John");
        await userEvent.type(screen.getByLabelText("Last Name"), "Doe");
        await userEvent.type(screen.getByLabelText("Email Address"), "john@example.com");
        await userEvent.type(screen.getByLabelText("Employee ID"), "EMP001");
        await userEvent.type(screen.getByLabelText("Username"), "johndoe");
        await userEvent.type(screen.getByLabelText("Password"), "Password123!");
        fireEvent.click(screen.getByRole("button", { name: /next/i }));

        // Step 2
        await waitFor(() => expect(screen.getByLabelText("Role")).toBeInTheDocument());

        // Open Role dropdown and select admin
        await userEvent.click(screen.getByLabelText("Role"));
        await userEvent.click(screen.getByRole("menuitemradio", { name: /Admin/i }));

        // Open Department dropdown and select IT (from the mock)
        await userEvent.click(screen.getByLabelText("Department"));
        await userEvent.click(screen.getByRole("menuitemradio", { name: /IT/i }));

        await waitFor(() => expect(screen.getByLabelText("Designation")).not.toBeDisabled());

        // Open Designation dropdown and select Developer
        await userEvent.click(screen.getByLabelText("Designation"));
        await userEvent.click(screen.getByRole("menuitemradio", { name: /Developer/i }));

        await userEvent.type(screen.getByLabelText("Joining Date"), "2023-01-01");
        fireEvent.click(screen.getByRole("button", { name: /next/i }));

        // Step 3
        await waitFor(() => expect(screen.getByText("System Privileges")).toBeInTheDocument());
        const saveButton = screen.getByRole("button", { name: /save changes/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        });
    });

    it("calls onCancel when cancel button is clicked", async () => {
        render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        await userEvent.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalled();
    });
});

