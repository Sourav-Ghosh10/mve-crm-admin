import { jest } from "@jest/globals";
import { render } from "@testing-library/react";
import EmployeeCalendarView from "./EmployeeCalendarView";

describe("EmployeeCalendarView Component", () => {
    const mockProps = {
        referenceDate: new Date('2024-01-01'),
        roster: null,
        onDateClick: jest.fn(),
        viewMode: 'month' as const,
        holidays: [],
    };

    it("renders without crashing", () => {
        const { container } = render(<EmployeeCalendarView {...mockProps} />);
        expect(container).toBeInTheDocument();
    });

    it("renders in week view mode", () => {
        const { container } = render(<EmployeeCalendarView {...mockProps} viewMode="week" />);
        expect(container).toBeInTheDocument();
    });
});
