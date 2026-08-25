import { render, screen, fireEvent } from "@testing-library/react";
import CalendarView from "./CalendarView";
import { jest } from "@jest/globals";
import type { Holiday } from "../../types/organization.types";

describe("CalendarView Component", () => {
    const mockDate = new Date("2024-01-01T00:00:00Z");
    const mockOnDateClick = jest.fn();
    const mockHolidays = [
        { _id: "h1", name: "New Year", date: "2024-01-01", isRecurring: true, isActive: true }
    ] as Holiday[];
    const mockUsersByDate = {
        "2024-01-01": {
            users: [{ _id: "u1", firstName: "John", lastName: "Doe" }],
            total: 1,
            hasMore: false
        }
    };

    it("renders calendar days", () => {
        render(
            <CalendarView
                referenceDate={mockDate}
                usersByDate={mockUsersByDate}
                onDateClick={mockOnDateClick}
                loading={false}
                viewMode="month"
                holidays={mockHolidays}
            />
        );

        // Check for day headers
        expect(screen.getByText("Mon")).toBeInTheDocument();
        // Check for specific date
        // Note: rendering might depend on timezone, but 1 should be present
        expect(screen.getAllByText("1")).toBeTruthy();
    });

    it("displays holiday information", () => {
        render(
            <CalendarView
                referenceDate={mockDate}
                usersByDate={mockUsersByDate}
                onDateClick={mockOnDateClick}
                loading={false}
                viewMode="month"
                holidays={mockHolidays}
            />
        );

        expect(screen.getByText("New Year")).toBeInTheDocument();
    });

    it("displays scheduled users", () => {
        render(
            <CalendarView
                referenceDate={mockDate}
                usersByDate={mockUsersByDate}
                onDateClick={mockOnDateClick}
                loading={false}
                viewMode="month"
                holidays={mockHolidays}
            />
        );

        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("handles date click", () => {
        render(
            <CalendarView
                referenceDate={mockDate}
                usersByDate={mockUsersByDate}
                onDateClick={mockOnDateClick}
                loading={false}
                viewMode="month"
                holidays={mockHolidays}
            />
        );

        // Find the cell for the 1st
        const dayCell = screen.getByText("John Doe").closest("div[class*='cursor-pointer']");
        if (dayCell) {
            fireEvent.click(dayCell);
            expect(mockOnDateClick).toHaveBeenCalled();
        } else {
            throw new Error("Day cell not found");
        }
    });

    it("renders week view correctly", () => {
        render(
            <CalendarView
                referenceDate={mockDate}
                usersByDate={mockUsersByDate}
                onDateClick={mockOnDateClick}
                loading={false}
                viewMode="week"
                holidays={mockHolidays}
            />
        );
        // Week view renders 7 days.
        const grids = screen.getAllByText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/i);
        expect(grids.length).toBeGreaterThanOrEqual(7);
    });
});
