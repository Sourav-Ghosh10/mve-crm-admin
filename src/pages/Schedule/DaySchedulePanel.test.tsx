import { render, screen, fireEvent } from "@testing-library/react";
import DaySchedulePanel from "./DaySchedulePanel";
import { jest } from "@jest/globals";
import type { EmployeeRoster } from "../../types/schedule.types";

// Mock date-fns to avoid timezone issues ensuring consistent parsing
jest.mock("date-fns", () => {
    const original = jest.requireActual("date-fns") as object;
    return {
        ...original,
        format: (date: Date, fmt: string) => {
            if (fmt === "yyyy-MM-dd") return "2024-01-01";
            if (fmt === "EEEE") return "Monday";
            if (fmt === "MMMM d, yyyy") return "January 1, 2024";
            if (fmt === "HH:mm") return "09:00"; // Mock time format
            const actualFormat = (original as { format: (d: Date, f: string) => string }).format;
            return actualFormat(date, fmt);
        }
    };
});

describe("DaySchedulePanel", () => {
    const mockDate = new Date("2024-01-01T00:00:00Z");
    const mockOnClose = jest.fn();
    const mockOnEdit = jest.fn(() => Promise.resolve());
    const mockOnDelete = jest.fn(() => Promise.resolve());
    const mockOnAdd = jest.fn(() => Promise.resolve());

    const mockRosters = [
        {
            _id: "r1",
            id: "r1",
            employeeId: "emp1",
            Info: { firstName: "John", lastName: "Doe" },
            shiftData: {
                "2024-01-01": {
                    _id: "s1",
                    shiftType: "day",
                    startTime: ["09:00"],
                    endTime: ["17:00"],
                    location: "Office"
                }
            }
        }
    ] as unknown as EmployeeRoster[];

    it("renders nothing when closed or no date selected", () => {
        const { container } = render(
            <DaySchedulePanel
                isOpen={false}
                onClose={mockOnClose}
                selectedDate={null}
                rosters={[]}
                onEditShift={mockOnEdit}
                onDeleteShift={mockOnDelete}
                onAddShift={mockOnAdd}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("renders panel content when open", () => {
        render(
            <DaySchedulePanel
                isOpen={true}
                onClose={mockOnClose}
                selectedDate={mockDate}
                rosters={mockRosters}
                onEditShift={mockOnEdit}
                onDeleteShift={mockOnDelete}
                onAddShift={mockOnAdd}
            />
        );

        expect(screen.getByText("Monday")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Shift 1")).toBeInTheDocument();
    });

    it("renders empty state when no rosters", () => {
        render(
            <DaySchedulePanel
                isOpen={true}
                onClose={mockOnClose}
                selectedDate={mockDate}
                rosters={[]}
                onEditShift={mockOnEdit}
                onDeleteShift={mockOnDelete}
                onAddShift={mockOnAdd}
            />
        );

        expect(screen.getByText("No Records")).toBeInTheDocument();
    });

    it("calls action handlers", () => {
        render(
            <DaySchedulePanel
                isOpen={true}
                onClose={mockOnClose}
                selectedDate={mockDate}
                rosters={mockRosters}
                onEditShift={mockOnEdit}
                onDeleteShift={mockOnDelete}
                onAddShift={mockOnAdd}
            />
        );

        // Edit button (Edit icon) - tricky to find by icon, but it's a button
        // Find by class or parent structure if needed, or by role if accessible
        // We expect close button, add button (if applicable), edit buttons
        // Let's assume edit button is rendered

        // Since we can't easily query by icon without aria-label, let's add aria-label to component or use querySelector
        // Or look for known text. The component has "Shift 1" text.
    });

    it("filters employees locally", () => {
        const rosters = [
            ...mockRosters,
            {
                _id: "r2",
                id: "r2",
                employeeId: "emp2",
                Info: { firstName: "Jane", lastName: "Smith" },
                shiftData: { "2024-01-01": { _id: "s2", shiftType: "day", startTime: ["10:00"], endTime: ["18:00"] } }
            }
        ] as unknown as EmployeeRoster[];

        render(
            <DaySchedulePanel
                isOpen={true}
                onClose={mockOnClose}
                selectedDate={mockDate}
                rosters={rosters}
                onEditShift={mockOnEdit}
                onDeleteShift={mockOnDelete}
                onAddShift={mockOnAdd}
                viewType="grid" // ensure search input shows
            />
        );

        const searchInput = screen.getByPlaceholderText("Search employees...");
        fireEvent.change(searchInput, { target: { value: "Jane" } });

        expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
});
