import { renderHook, render, screen, fireEvent } from "@testing-library/react";
import { useLeaveColumns } from "./useLeaveColumns";
import type { LeaveRequest } from "../../types/leave.types";

// Wrapper to render the component returned by format function
const ColumnCell = ({ format, value, row }: { format: ((val: unknown, row: LeaveRequest, index: number) => React.ReactNode) | undefined, value: unknown, row: unknown }) => {
    return <>{format ? format(value, row as LeaveRequest, 0) : null}</>;
};

describe("useLeaveColumns Hook", () => {
    const mockOnApprove = jest.fn();
    const mockOnReject = jest.fn();
    const mockRow = {
        _id: "leave1",
        employeeId: {
            personalInfo: { firstName: "John", lastName: "Doe" },
            employment: { designation: "Dev", reportingManager: "mgr1" },
            fullName: "John Doe"
        },
        leaveType: "sick_leave",
        startDate: "2024-01-01",
        endDate: "2024-01-02",
        numberOfDays: 2,
        status: "pending",
        reason: "Flu"
    };

    it("renders employee column correctly", () => {
        const { result } = renderHook(() => useLeaveColumns({ onApprove: mockOnApprove, onReject: mockOnReject, currentUserId: "admin" }));
        const columns = result.current;

        const employeeCol = columns.find(c => c._id === "userId");
        render(<ColumnCell format={employeeCol?.format} value={mockRow.employeeId} row={mockRow} />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Dev")).toBeInTheDocument();
    });

    it("renders leave type column correctly", () => {
        const { result } = renderHook(() => useLeaveColumns({ onApprove: mockOnApprove, onReject: mockOnReject }));
        const columns = result.current;

        const typeCol = columns.find(c => c._id === "leaveType");
        render(<ColumnCell format={typeCol?.format} value="sick_leave" row={mockRow} />);

        expect(screen.getByText("sick leave")).toBeInTheDocument();
    });

    it("renders status column correctly", () => {
        const { result } = renderHook(() => useLeaveColumns({ onApprove: mockOnApprove, onReject: mockOnReject }));
        const columns = result.current;

        const statusCol = columns.find(c => c._id === "status");
        render(<ColumnCell format={statusCol?.format} value="pending" row={mockRow} />);

        // Relies on StatusBadge internally, assuming it renders text "pending"
        expect(screen.getByText("pending")).toBeInTheDocument();
    });

    it("renders actions column correctly when authorized", () => {
        const { result } = renderHook(() => useLeaveColumns({
            onApprove: mockOnApprove,
            onReject: mockOnReject,
            currentUserId: "mgr1" // Matches reporting manager
        }));
        const columns = result.current;

        const actionsCol = columns.find(c => c._id === "actions");
        render(<ColumnCell format={actionsCol?.format} value={null} row={mockRow} />);

        const approveBtn = screen.getByTitle("Approve");
        const rejectBtn = screen.getByTitle("Reject");

        expect(approveBtn).toBeInTheDocument();
        expect(rejectBtn).toBeInTheDocument();

        fireEvent.click(approveBtn);
        expect(mockOnApprove).toHaveBeenCalledWith(mockRow);
    });

    it("displays View Only when unauthorized", () => {
        const { result } = renderHook(() => useLeaveColumns({
            onApprove: mockOnApprove,
            onReject: mockOnReject,
            currentUserId: "other_user"
        }));
        const columns = result.current;

        const actionsCol = columns.find(c => c._id === "actions");
        render(<ColumnCell format={actionsCol?.format} value={null} row={mockRow} />);

        expect(screen.getByText("View Only")).toBeInTheDocument();
        expect(screen.queryByTitle("Approve")).not.toBeInTheDocument();
    });
});
