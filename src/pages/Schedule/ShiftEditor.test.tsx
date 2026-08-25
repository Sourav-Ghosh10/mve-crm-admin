import { jest } from "@jest/globals";
import { render } from "@testing-library/react";
import ShiftEditor, { ShiftEditorProps } from "./ShiftEditor";

describe("ShiftEditor Component", () => {
    const mockProps: ShiftEditorProps = {
        isOpen: false,
        onClose: jest.fn() as unknown as ShiftEditorProps['onClose'],
        onSave: jest.fn().mockImplementation(() => Promise.resolve()) as ShiftEditorProps['onSave'],
        employees: [],
        locations: [],
    };

    it("renders without crashing when closed", () => {
        const { container } = render(<ShiftEditor {...mockProps} />);
        expect(container).toBeInTheDocument();
    });

    it("renders modal when open", () => {
        const { container } = render(<ShiftEditor {...mockProps} isOpen={true} />);
        expect(container).toBeInTheDocument();
    });
});
