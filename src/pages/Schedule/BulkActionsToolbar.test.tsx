import { render, screen, fireEvent } from "@testing-library/react";
import BulkActionsToolbar from "./BulkActionsToolbar";
import { jest } from "@jest/globals";

describe("BulkActionsToolbar", () => {
    const mockOnAssign = jest.fn();
    const mockOnMarkOff = jest.fn();
    const mockOnClear = jest.fn();

    it("renders nothing when selection is empty", () => {
        render(
            <BulkActionsToolbar
                selectedCount={0}
                onBulkAssign={mockOnAssign}
                onBulkMarkOff={mockOnMarkOff}
                onClearSelection={mockOnClear}
            />
        );
        expect(screen.queryByText(/5 Employee/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Active Selection/i)).not.toBeInTheDocument();
    });

    it("renders when items are selected", () => {
        render(
            <BulkActionsToolbar
                selectedCount={5}
                onBulkAssign={mockOnAssign}
                onBulkMarkOff={mockOnMarkOff}
                onClearSelection={mockOnClear}
            />
        );
        expect(screen.getByText(/5 Employee/i)).toBeInTheDocument();
        expect(screen.getByText(/Active Selection/i)).toBeInTheDocument();
    });

    it("calls action handlers", () => {
        render(
            <BulkActionsToolbar
                selectedCount={5}
                onBulkAssign={mockOnAssign}
                onBulkMarkOff={mockOnMarkOff}
                onClearSelection={mockOnClear}
            />
        );

        const assignBtn = screen.getByRole("button", { name: /Assign New Shift/i });
        const markOffBtn = screen.getByRole("button", { name: /Mark Off/i });
        // Use title for the clear button as it has a title attribute
        const clearBtn = screen.getByTitle(/Clear Selection/i);

        fireEvent.click(assignBtn);
        expect(mockOnAssign).toHaveBeenCalled();

        fireEvent.click(markOffBtn);
        expect(mockOnMarkOff).toHaveBeenCalled();

        fireEvent.click(clearBtn);
        expect(mockOnClear).toHaveBeenCalled();
    });
});
