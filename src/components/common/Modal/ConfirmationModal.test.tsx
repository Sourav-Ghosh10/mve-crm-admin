import { jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmationModal from "./ConfirmationModal";

describe("ConfirmationModal Component", () => {
    const onCloseMock = jest.fn();
    const onConfirmMock = jest.fn();

    const defaultProps = {
        open: true,
        onClose: onCloseMock,
        onConfirm: onConfirmMock,
        title: "Confirm Action",
        message: "Are you sure you want to do this?",
    };

    beforeEach(() => {
        onCloseMock.mockClear();
        onConfirmMock.mockClear();
    });

    it("renders with default props", () => {
        render(<ConfirmationModal {...defaultProps} />);

        expect(screen.getByText("Confirm Action")).toBeInTheDocument();
        expect(screen.getByText("Are you sure you want to do this?")).toBeInTheDocument();
        expect(screen.getByText("Confirm")).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("calls onConfirm and onClose when confirm button is clicked", () => {
        render(<ConfirmationModal {...defaultProps} />);

        fireEvent.click(screen.getByText("Confirm"));

        expect(onConfirmMock).toHaveBeenCalledTimes(1);
        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it("calls only onClose when cancel button is clicked", () => {
        render(<ConfirmationModal {...defaultProps} />);

        fireEvent.click(screen.getByText("Cancel"));

        expect(onConfirmMock).not.toHaveBeenCalled();
        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it("renders correct labels when provided", () => {
        render(
            <ConfirmationModal
                {...defaultProps}
                confirmLabel="Yes, Delete"
                cancelLabel="No, keep it"
            />
        );

        expect(screen.getByText("Yes, Delete")).toBeInTheDocument();
        expect(screen.getByText("No, keep it")).toBeInTheDocument();
    });

    it("renders correct icon for danger variant", () => {
        const { container } = render(<ConfirmationModal {...defaultProps} variant="danger" />);
        // AlertTriangle icon check - we check for the text-error color class
        expect(container.querySelector(".text-error")).toBeInTheDocument();
    });

    it("renders correct icon for success variant", () => {
        const { container } = render(<ConfirmationModal {...defaultProps} variant="success" />);
        // CheckCircle2 icon check - we check for the text-success color class
        expect(container.querySelector(".text-success")).toBeInTheDocument();
    });

    it("renders correct icon for info variant", () => {
        const { container } = render(<ConfirmationModal {...defaultProps} variant="info" />);
        // Info icon check - we check for the text-info color class
        expect(container.querySelector(".text-info")).toBeInTheDocument();
    });
});
