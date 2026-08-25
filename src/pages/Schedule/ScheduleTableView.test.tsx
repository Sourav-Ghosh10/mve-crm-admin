import { render, screen } from "@testing-library/react";
import ScheduleTableView from "./ScheduleTableView";
import type { EmployeeRoster } from "../../types/schedule.types";

describe("ScheduleTableView Component", () => {
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

    it("renders table with shifts", () => {
        render(
            <ScheduleTableView
                rosters={mockRosters}
                startDate="2024-01-01"
                endDate="2024-01-01"
            />
        );

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("SHIFT")).toBeInTheDocument();
        // Check fuzzy match for date or precise
        expect(screen.getByText(/Jan 1, 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/09:00 - 17:00/i)).toBeInTheDocument();
    });

    it("renders empty state", () => {
        render(
            <ScheduleTableView
                rosters={[]}
                startDate="2024-01-01"
                endDate="2024-01-01"
            />
        );

        expect(screen.getByText("No Shifts Found")).toBeInTheDocument();
    });

    it("filters out off shifts", () => {
        const offRosters = [
            {
                _id: "r1",
                id: "r1",
                employeeId: "emp1",
                Info: { firstName: "John", lastName: "Doe" },
                shiftData: {
                    "2024-01-01": {
                        _id: "s1",
                        shiftType: "off",
                        startTime: [],
                        endTime: [],
                        location: "Office"
                    }
                }
            }
        ] as unknown as EmployeeRoster[];

        render(
            <ScheduleTableView
                rosters={offRosters}
                startDate="2024-01-01"
                endDate="2024-01-01"
            />
        );

        expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
        expect(screen.getByText("No Shifts Found")).toBeInTheDocument();
    });
});
