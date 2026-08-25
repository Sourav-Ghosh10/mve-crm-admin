import { jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "./Modal";

describe("Modal Component", () => {
    const onCloseMock = jest.fn();

    beforeEach(() => {
        onCloseMock.mockClear();
    });

    it("does not render when open is false", () => {
        render(
            <Modal open={false} onClose={onCloseMock} title="Test Modal">
                <div>Modal Content</div>
            </Modal>
        );
        expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
    });

    it("renders correct content when open is true", () => {
        render(
            <Modal open={true} onClose={onCloseMock} title="Test Modal">
                <div>Modal Content</div>
            </Modal>
        );
        expect(screen.getByText("Test Modal")).toBeInTheDocument();
        expect(screen.getByText("Modal Content")).toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", () => {
        render(
            <Modal open={true} onClose={onCloseMock} title="Test Modal">
                <div>Content</div>
            </Modal>
        );
        fireEvent.click(screen.getByLabelText("Close modal"));
        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when escape key is pressed", () => {
        render(
            <Modal open={true} onClose={onCloseMock} title="Test Modal">
                <div>Content</div>
            </Modal>
        );
        fireEvent.keyDown(document, { key: "Escape" });
        expect(onCloseMock).not.toHaveBeenCalled();
    });

    it("renders actions if provided", () => {
        render(
            <Modal
                open={true}
                onClose={onCloseMock}
                title="Test Modal"
                actions={<button>Action Button</button>}
            >
                <div>Content</div>
            </Modal>
        );
        expect(screen.getByText("Action Button")).toBeInTheDocument();
    });
});
