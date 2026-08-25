import { render, screen } from "@testing-library/react";
import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner", () => {
    it("renders with default props", () => {
        render(<LoadingSpinner />);
        const spinner = document.querySelector(".animate-spin");
        expect(spinner).toBeInTheDocument();
        expect(spinner).toHaveClass("w-12 h-12"); // Default size lg
    });

    it("renders with specific size", () => {
        render(<LoadingSpinner size="lg" />);
        const spinner = document.querySelector(".animate-spin");
        expect(spinner).toHaveClass("w-12 h-12");
    });

    it("renders with message", () => {
        render(<LoadingSpinner message="Loading data..." />);
        expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });

    it("renders in full screen mode", () => {
        const { container } = render(<LoadingSpinner fullScreen />);
        expect(container.firstChild).toHaveClass("h-screen w-full");
    });
});
